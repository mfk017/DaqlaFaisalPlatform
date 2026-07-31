import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const p = await params;
    
    const category = await db.category.findUnique({
      where: { id: p.id },
      include: {
        stages: {
          orderBy: { order_index: 'asc' }
        }
      }
    });

    if (!category) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

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

    // Get current max order_index
    const lastStage = await db.workflowStage.findFirst({
      where: { category_id: p.id },
      orderBy: { order_index: 'desc' }
    });

    const nextIndex = lastStage ? lastStage.order_index + 1 : 1;

    const newStage = await db.workflowStage.create({
      data: {
        category_id: p.id,
        name: body.name.trim(),
        order_index: nextIndex,
        is_quality: !!body.is_quality,
        is_final: !!body.is_final,
        allowed_role: body.allowed_role || null,
        allowed_specialty: body.allowed_specialty || null,
        estimated_hours: body.estimated_hours || 24
      }
    });

    // Check activation criteria
    await checkCategoryActivation(p.id);

    return NextResponse.json({ stage: newStage });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const p = await params;
    // Expected to receive the entire array of stages in the new order
    const { stages } = await req.json();

    if (!Array.isArray(stages)) {
      return NextResponse.json({ error: 'Stages array required' }, { status: 400 });
    }

    await db.$transaction(
      stages.map((stage: { id: string }, index: number) => 
        db.workflowStage.update({
          where: { id: stage.id, category_id: p.id },
          data: { order_index: index + 1 }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function checkCategoryActivation(categoryId: string) {
  const stages = await db.workflowStage.findMany({ where: { category_id: categoryId } });
  const hasQuality = stages.some(s => s.is_quality);
  const hasFinal = stages.some(s => s.is_final);

  await db.category.update({
    where: { id: categoryId },
    data: { is_active: hasQuality && hasFinal }
  });
}
