import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { login, register, forgotPassword, verifyOtp } from '../controllers/auth.controller.js';

const router = Router();
const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:8081';

router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);

// Returns whether Google OAuth credentials are configured in this environment.
// The frontend uses this to disable the Google button when credentials are absent.
router.get('/google/status', (_req, res) => {
  const configured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return res.json({ configured });
});

router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${FRONTEND}/login?error=oauth_not_configured`);
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${FRONTEND}/login?error=oauth_not_configured`);
  }
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect(`${FRONTEND}/login?error=oauth_failed`);
    }
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    return res.redirect(`${FRONTEND}/auth/callback?token=${token}`);
  })(req, res, next);
});

export default router;

