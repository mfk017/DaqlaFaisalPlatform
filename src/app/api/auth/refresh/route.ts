import { NextResponse } from 'next/server';
import { getSession, createSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const profile = await db.profile.findUnique({
      where: { id: session.sub },
      include: { roles: true }
    });

    if (profile && profile.approved && profile.roles.length > 0) {
      await createSession({
        sub: profile.id,
        approved: profile.approved,
        roles: profile.roles.map(r => r.role),
        specialty: profile.roles.find(r => r.role === 'worker')?.specialty || undefined,
      });
      return NextResponse.json({ success: true, approved: true });
    }

    return NextResponse.json({ success: true, approved: false });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
