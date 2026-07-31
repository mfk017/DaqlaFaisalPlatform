import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { full_name, username, email, password } = await req.json();

    if (!full_name || !username || !email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const existingUser = await db.profile.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email or username already taken' }, { status: 400 });
    }

    const isFirstUser = await db.profile.count() === 0;
    const password_hash = await bcrypt.hash(password, 12);

    const user = await db.profile.create({
      data: {
        full_name,
        username,
        email,
        password_hash,
        approved: isFirstUser, // First user is auto-approved
      }
    });

    if (isFirstUser) {
      await db.userRole.create({
        data: {
          profile_id: user.id,
          role: 'admin'
        }
      });
    }

    const roles = isFirstUser ? ['admin'] : [];

    await createSession({
      sub: user.id,
      approved: user.approved,
      roles: roles
    });

    return NextResponse.json({ success: true, approved: user.approved });
  } catch (error) {
    console.error('Signup error', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
