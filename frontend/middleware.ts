import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-to-a-random-secret';

// Web Crypto HS256 JWT Verification Helper
async function verifyJWT(token: string, secret: string): Promise<{ user_id: string; role: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const base64UrlDecode = (str: string): Uint8Array => {
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    };

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const tokenInput = `${headerB64}.${payloadB64}`;
    const sigBuf = base64UrlDecode(signatureB64);
    const isValid = await crypto.subtle.verify('HMAC', key, sigBuf as unknown as BufferSource, enc.encode(tokenInput) as unknown as BufferSource);
    if (!isValid) return null;

    const payloadStr = new TextDecoder().decode(base64UrlDecode(payloadB64));
    return JSON.parse(payloadStr);
  } catch (err) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve token cookie
  const token = request.cookies.get('token')?.value;

  let payload: { user_id: string; role: string } | null = null;
  if (token) {
    payload = await verifyJWT(token, JWT_SECRET);
  }

  // Paths that are accessible without authentication
  const isPublicRoute = pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/_next') || pathname.includes('/favicon.ico');

  if (!payload) {
    if (!isPublicRoute) {
      // Redirect unauthenticated user to login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Authenticated users should be redirected away from login or /dashboard to their specific role dashboard
  if (pathname === '/login' || pathname === '/dashboard') {
    return NextResponse.redirect(new URL(getHomePathForRole(payload.role), request.url));
  }

  // Enforce role-based routing (backend uses capitalized roles: Analyst, CFO, Admin)
  const role = payload.role;

  if (pathname.startsWith('/analyst') && role !== 'Analyst') {
    return NextResponse.redirect(new URL(getHomePathForRole(payload.role), request.url));
  }

  if (pathname.startsWith('/cfo') && role !== 'CFO') {
    return NextResponse.redirect(new URL(getHomePathForRole(payload.role), request.url));
  }

  if (pathname.startsWith('/admin') && role !== 'Admin') {
    return NextResponse.redirect(new URL(getHomePathForRole(payload.role), request.url));
  }

  return NextResponse.next();
}

function getHomePathForRole(role: string): string {
  if (role === 'Admin') return '/admin/users';
  if (role === 'CFO') return '/cfo/dashboard';
  return '/analyst/dashboard';
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
