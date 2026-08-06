import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { login, register, forgotPassword, verifyOtp } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);

router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect('http://localhost:8081/login?error=oauth_failed');
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect('http://localhost:8081/login?error=oauth_failed');
  }
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect('http://localhost:8081/login?error=oauth_failed');
    }
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    return res.redirect(`http://localhost:8081/auth/callback?token=${token}`);
  })(req, res, next);
});

export default router;
