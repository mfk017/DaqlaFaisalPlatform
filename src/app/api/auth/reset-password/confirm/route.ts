import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { token, id, password } = await req.json();

    if (!token || !id || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Find all valid tokens for this user
    const dbTokens = await db.passwordResetToken.findMany({
      where: {
        profile_id: id,
        used: false,
        expires_at: { gt: new Date() }
      }
    });

    let validTokenId = null;

    for (const dbToken of dbTokens) {
      const isValid = await bcrypt.compare(token, dbToken.token_hash);
      if (isValid) {
        validTokenId = dbToken.id;
        break;
      }
    }

    if (!validTokenId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    // Update password
    const password_hash = await bcrypt.hash(password, 12);
    
    await db.$transaction([
      db.profile.update({
        where: { id },
        data: { password_hash }
      }),
      db.passwordResetToken.update({
        where: { id: validTokenId },
        data: { used: true }
      }),
      db.passwordAudit.create({
        data: {
          profile_id: id,
          email: 'System Recovery', // We don't have email in this scope easily without another query, so just log the event
          event: 'completed',
          ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
          user_agent: req.headers.get('user-agent') || 'unknown'
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset confirm error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
