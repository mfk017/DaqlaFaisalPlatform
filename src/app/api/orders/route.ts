import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApproved } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await requireApproved();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';

    const isAdmin = session.roles.includes('admin') || session.roles.includes('reception');

    const whereClause: any = {};
    
    if (!isAdmin) {
      // Workers can ONLY see orders assigned to them
      whereClause.current_assignee_id = session.sub;
      whereClause.status = { in: ['in_progress', 'returned'] };
    } else {
      // Admins/Reception can use filters
      if (filter === 'mine') {
        whereClause.current_assignee_id = session.sub;
        whereClause.status = { in: ['in_progress', 'returned'] };
      } else if (filter === 'completed') {
        whereClause.status = 'completed';
      } else if (filter === 'returned') {
        whereClause.status = 'returned';
      } else if (filter === 'all') {
        whereClause.status = 'in_progress';
      }
    }

    const search = searchParams.get('search');
    if (search) {
      whereClause.OR = [
        { invoice_number: { contains: search } },
        { customer_name: { contains: search } }
      ];
    }

    const priority = searchParams.get('priority');
    if (priority && priority !== 'all') {
      whereClause.priority = priority;
    }

    const orders = await db.order.findMany({
      where: whereClause,
      include: {
        category: true,
        branch: true,
        current_stage: true,
        current_assignee: { select: { full_name: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireApproved();
    if (!session.roles.includes('admin') && !session.roles.includes('reception')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { customer_name, category_id, branch_id, assignee_id, priority, due_date } = await req.json();

    if (!customer_name || !category_id || !branch_id || !assignee_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Get the first stage of the category
    const category = await db.category.findUnique({
      where: { id: category_id },
      include: { stages: { orderBy: { order_index: 'asc' }, take: 1 } }
    });

    if (!category || category.stages.length === 0 || !category.is_active) {
      return NextResponse.json({ error: 'Invalid or inactive category' }, { status: 400 });
    }

    const firstStage = category.stages[0];

    // Generate Invoice Number INV-{YYYY}-{0001}
    const currentYear = new Date().getFullYear();
    const lastOrder = await db.order.findFirst({
      where: { invoice_number: { startsWith: `INV-${currentYear}-` } },
      orderBy: { invoice_number: 'desc' }
    });

    let nextNumber = 1;
    if (lastOrder) {
      const parts = lastOrder.invoice_number.split('-');
      if (parts.length === 3) {
        nextNumber = parseInt(parts[2], 10) + 1;
      }
    }
    const invoice_number = `INV-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;

    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          invoice_number,
          customer_name,
          category_id,
          branch_id,
          current_stage_id: firstStage.id,
          current_assignee_id: assignee_id,
          priority: priority || 'normal',
          due_date: due_date ? new Date(due_date) : null
        }
      });

      await tx.orderHistory.create({
        data: {
          order_id: newOrder.id,
          stage_id: firstStage.id,
          actor_id: session.sub,
          assigned_to_id: assignee_id,
          action: 'created',
          notes: 'Order received and dispatched to first stage.'
        }
      });

      return newOrder;
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
