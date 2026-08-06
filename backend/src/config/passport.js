import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { pool } from './db.js';

// Google OAuth requires a real Google Cloud Console project with OAuth 2.0 credentials.
// Where to get GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
// 1. Go to console.cloud.google.com -> APIs & Services -> Credentials -> Create OAuth 2.0 Client ID
// 2. Set Authorized redirect URI = http://localhost:8081/api/auth/google/callback
// 3. Paste Client ID and Client Secret into your .env file.
export function configurePassport() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("[OAUTH] GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not set in .env. Google login will redirect to error until configured.");
    return;
  }

  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8081/api/auth/google/callback'
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
