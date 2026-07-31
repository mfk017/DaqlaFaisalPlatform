import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const user = await db.profile.findUnique({ where: { email } });

    // We don't want to leak whether the email exists, so we always return success
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = await bcrypt.hash(resetToken, 10);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.passwordResetToken.create({
        data: {
          profile_id: user.id,
          token_hash: tokenHash,
          expires_at: expiresAt
        }
      });

      await db.passwordAudit.create({
        data: {
          profile_id: user.id,
          email: user.email,
          event: 'requested',
          ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
          user_agent: req.headers.get('user-agent') || 'unknown'
        }
      });

      // IN LOCAL DEV: just log it out instead of emailing
      console.log(`\n\n[RESET PASSWORD LINK FOR ${user.email}]:\nhttp://localhost:3000/reset-password?token=${resetToken}&id=${user.id}\n\n`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset request error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
