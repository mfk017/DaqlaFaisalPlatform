import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { role, specialty } = await req.json();
    const p = await params;

    // For Phase 1 we only support 1 role per user for simplicity in this endpoint
    // though the DB supports many. We'll wipe and replace.
    await db.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { profile_id: p.id } });
      if (role) {
        await tx.userRole.create({
          data: {
            profile_id: p.id,
            role: role as string,
            specialty: specialty as string || null
          }
        });
        
        // Auto-approve the user when a role is assigned
        await tx.profile.update({
          where: { id: p.id },
          data: { approved: true }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Role update error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
