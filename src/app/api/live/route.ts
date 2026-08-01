import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApproved } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Basic auth check
    await requireApproved();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activeToday, completedTodayOrders, activeOrders] = await Promise.all([
      db.order.count({ where: { status: { in: ['in_progress', 'returned'] } } }),
      db.order.count({ where: { status: 'completed', updated_at: { gte: today } } }),
      db.order.findMany({
        where: { status: { in: ['in_progress', 'returned'] } },
        include: { current_stage: true, category: true }
      })
    ]);

    let lateOrdersCount = 0;
    const now = new Date().getTime();

    // Calculate late orders and urgent orders
    const urgentOrdersList: any[] = [];

    for (const order of activeOrders) {
      // Is late?
      let isLate = false;
      if (order.due_date) {
        const due = new Date(order.due_date).getTime();
        if (now > due) {
          lateOrdersCount++;
          isLate = true;
        }
      }

      // Add to urgent list if rush or late
      if (order.priority === 'rush' || isLate) {
        urgentOrdersList.push({
          ...order,
          isLate,
          timeSinceMoveMs: now - new Date(order.updated_at).getTime()
        });
      }
    }

    // Sort urgent orders: late ones first, then rush, then longest waiting
    urgentOrdersList.sort((a, b) => {
      if (a.isLate && !b.isLate) return -1;
      if (!a.isLate && b.isLate) return 1;
      if (a.priority === 'rush' && b.priority !== 'rush') return -1;
      if (a.priority !== 'rush' && b.priority === 'rush') return 1;
      return b.timeSinceMoveMs - a.timeSinceMoveMs; // longest waiting first
    });

    return NextResponse.json({
      activeToday,
      completedToday: completedTodayOrders,
      lateOrdersCount,
      urgentOrders: urgentOrdersList.slice(0, 5) // top 5
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
