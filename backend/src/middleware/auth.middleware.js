/**
 * Placeholder authentication middleware.
 * Replace with real JWT verification once the auth flow is built.
 */
export function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  // TODO: verify JWT using env.jwtSecret
  const token = header.split(' ')[1];
  req.user = { token };  // attach decoded payload here later
  next();
}
