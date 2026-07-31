import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const p = await params;
    
    const categoryInfo = await db.category.findUnique({ where: { id: p.id } });
    if (!categoryInfo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const category = await db.category.findUnique({
      where: { id: p.id },
      include: {
        stages: {
          where: { version: categoryInfo.current_version },
          orderBy: { order_index: 'asc' }
        }
      }
    });

    return NextResponse.json({ category });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const p = await params;
    const body = await req.json();
    const { name } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const category = await db.category.findUnique({ where: { id: p.id } });
    if (!category) throw new Error('Category not found');

    const nextVersion = category.current_version + 1;

    // Get current stages
    const currentStages = await db.workflowStage.findMany({
      where: { category_id: p.id, version: category.current_version },
      orderBy: { order_index: 'asc' }
    });

    // Copy old stages to new version
    await db.$transaction(async (tx) => {
      let nextIndex = 1;
      for (const s of currentStages) {
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

      // Add the new stage
      const newStage = await tx.workflowStage.create({
        data: {
          category_id: p.id,
          version: nextVersion,
          name: name.trim(),
          order_index: nextIndex,
          is_quality: !!body.is_quality,
          is_final: !!body.is_final,
          allowed_role: body.allowed_role || null,
          allowed_specialty: body.allowed_specialty || null,
          estimated_hours: body.estimated_hours || 24
        }
      });

      await tx.category.update({
        where: { id: p.id },
        data: { current_version: nextVersion }
      });
    });

    await checkCategoryActivation(p.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const p = await params;
    const { stages } = await req.json(); // Array of old stage IDs in new order

    if (!Array.isArray(stages)) {
      return NextResponse.json({ error: 'Stages array required' }, { status: 400 });
    }

    const category = await db.category.findUnique({ where: { id: p.id } });
    if (!category) throw new Error('Category not found');

    const nextVersion = category.current_version + 1;

    // We must find the full stage objects so we can copy them
    const currentStages = await db.workflowStage.findMany({
      where: { category_id: p.id, version: category.current_version }
    });

    await db.$transaction(async (tx) => {
      for (let i = 0; i < stages.length; i++) {
        const oldStage = currentStages.find(s => s.id === stages[i].id);
        if (oldStage) {
          await tx.workflowStage.create({
            data: {
              category_id: p.id,
              version: nextVersion,
              name: oldStage.name,
              order_index: i + 1,
              is_quality: oldStage.is_quality,
              is_final: oldStage.is_final,
              allowed_role: oldStage.allowed_role,
              allowed_specialty: oldStage.allowed_specialty,
              estimated_hours: oldStage.estimated_hours
            }
          });
        }
      }

      await tx.category.update({
        where: { id: p.id },
        data: { current_version: nextVersion }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function checkCategoryActivation(categoryId: string) {
  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category) return;

  const stages = await db.workflowStage.findMany({ where: { category_id: categoryId, version: category.current_version } });
  const hasQuality = stages.some(s => s.is_quality);
  const hasFinal = stages.some(s => s.is_final);

  await db.category.update({
    where: { id: categoryId },
    data: { is_active: hasQuality && hasFinal }
  });
}
