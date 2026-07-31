import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-local-dev-factory-workflow-2026';
const key = new TextEncoder().encode(JWT_SECRET);

export type SessionPayload = {
  sub: string;
  approved: boolean;
  roles: string[];
  specialty?: string;
};

export async function createSession(payload: SessionPayload) {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);

  (await cookies()).set('__session', jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function getSession() {
  const cookie = (await cookies()).get('__session')?.value;
  if (!cookie) return null;
  return await verifySession(cookie);
}

export async function clearSession() {
  (await cookies()).delete('__session');
}

export async function requireSession(redirectTo = '/login') {
  const session = await getSession();
  if (!session) {
    redirect(redirectTo);
  }
  return session;
}

export async function requireApproved() {
  const session = await requireSession();
  
  if (!session.approved || session.roles.length === 0) {
    redirect('/pending-approval');
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireApproved();
  if (!session.roles.includes('admin')) {
    redirect('/dashboard');
  }
  return session;
}
