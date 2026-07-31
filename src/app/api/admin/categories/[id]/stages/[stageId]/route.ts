import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string, stageId: string }> }) {
  try {
    await requireAdmin();
    const p = await params;

    const category = await db.category.findUnique({ where: { id: p.id } });
    if (!category) throw new Error('Category not found');

    const nextVersion = category.current_version + 1;

    // Get current stages
    const currentStages = await db.workflowStage.findMany({
      where: { category_id: p.id, version: category.current_version },
      orderBy: { order_index: 'asc' }
    });

    await db.$transaction(async (tx) => {
      let nextIndex = 1;
      for (const s of currentStages) {
        if (s.id === p.stageId) continue; // Skip the deleted stage
        
        await tx.workflowStage.create({
          data: {
            category_id: p.id,
            version: nextVersion,
            name: s.name,
            order_index: nextIndex++,
            is_quality: s.is_quality,
            is_final: s.is_final,
            allowed_role: s.allowed_role,
            allowed_specialty: s.allowed_specialty,
            estimated_hours: s.estimated_hours
          }
        });
      }

      await tx.category.update({
        where: { id: p.id },
        data: { current_version: nextVersion }
      });
    });

    // Re-check activation criteria (we must fetch the new version stages)
    const newStages = await db.workflowStage.findMany({ where: { category_id: p.id, version: nextVersion } });
    const hasQuality = newStages.some(s => s.is_quality);
    const hasFinal = newStages.some(s => s.is_final);

    await db.category.update({
      where: { id: p.id },
      data: { is_active: hasQuality && hasFinal }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
