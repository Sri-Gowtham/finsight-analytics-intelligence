import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { pool } from './db.js';

// Google OAuth requires a real Google Cloud Console project with OAuth 2.0 credentials.
// See backend/.env.example for full setup instructions.
// IMPORTANT: Authorized redirect URI in Google Console must point to the BACKEND port (3001),
// NOT the Vite frontend port (8081), because Google calls the callback directly.
export function configurePassport() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("[OAUTH] GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not set in .env. Google login will be disabled until configured.");
    return;
  }

  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(null, false, { message: 'No email provided by Google profile' });
        }
        const { rows } = await pool.query('SELECT user_id, name, email, role FROM users WHERE email = $1', [email]);
        let user;
        if (rows.length === 0) {
          const name = profile.displayName || email.split('@')[0];
          const res = await pool.query(
            'INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, null) RETURNING user_id, name, email, role',
            [name, email, 'Analyst']
          );
          user = res.rows[0];
        } else {
          user = rows[0];
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
}
