import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApproved } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApproved();
    const p = await params;
    
    const order = await db.order.findUnique({
      where: { id: p.id },
      include: {
        category: {
          include: { stages: { orderBy: { order_index: 'asc' } } }
        },
        branch: true,
        current_stage: true,
        current_assignee: { select: { id: true, full_name: true } },
        history: {
          include: {
            actor: { select: { full_name: true } },
            assigned_to: { select: { full_name: true } },
            stage: true
          },
          orderBy: { created_at: 'desc' }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApproved();
    if (!session.roles.includes('admin') && !session.roles.includes('reception')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const p = await params;
    const body = await req.json();

    const order = await db.order.update({
      where: { id: p.id },
      data: {
        priority: body.priority,
        due_date: body.due_date ? new Date(body.due_date) : null
      }
    });

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
