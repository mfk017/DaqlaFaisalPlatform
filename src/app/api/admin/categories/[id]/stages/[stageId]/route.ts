import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string, stageId: string }> }) {
  try {
    await requireAdmin();
    const p = await params;

    await db.workflowStage.delete({
      where: { id: p.stageId, category_id: p.id }
    });

    // Re-check activation criteria
    const stages = await db.workflowStage.findMany({ where: { category_id: p.id } });
    const hasQuality = stages.some(s => s.is_quality);
    const hasFinal = stages.some(s => s.is_final);

    await db.category.update({
      where: { id: p.id },
      data: { is_active: hasQuality && hasFinal }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
