import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-local-dev-factory-workflow-2026';
const key = new TextEncoder().encode(JWT_SECRET);

const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/api/auth/login', '/api/auth/signup', '/api/auth/reset-password/request', '/api/auth/reset-password/confirm'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Skip static files and next internals
  if (path.startsWith('/_next') || path.match(/\.(css|js|jpg|png|ico|svg)$/)) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.some(r => path === r || path.startsWith(r + '/'))) {
    return NextResponse.next();
  }

  const token = req.cookies.get('__session')?.value;

  if (!token) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    
    // Auth bypass checks
    const isApproved = payload.approved === true;
    const hasRole = Array.isArray(payload.roles) && payload.roles.length > 0;

    if (!isApproved || !hasRole) {
      if (path !== '/pending-approval' && !path.startsWith('/api/auth/logout')) {
         if (path.startsWith('/api/')) {
             return NextResponse.json({ error: 'Forbidden: Unapproved' }, { status: 403 });
         }
         return NextResponse.redirect(new URL('/pending-approval', req.url));
      }
    } else {
      if (path === '/pending-approval') {
         return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // Admin routes
    if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
      if (!Array.isArray(payload.roles) || !payload.roles.includes('admin')) {
         if (path.startsWith('/api/')) {
             return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
         }
         return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Invalid token
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('__session');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
