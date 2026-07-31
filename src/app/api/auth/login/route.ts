import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const user = await db.profile.findUnique({
      where: { email },
      include: { roles: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }

    const roles = user.roles.map(r => r.role);

    await createSession({
      sub: user.id,
      approved: user.approved,
      roles: roles
    });

    return NextResponse.json({ success: true, approved: user.approved });
  } catch (error) {
    console.error('Login error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
