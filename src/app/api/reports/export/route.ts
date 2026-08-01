import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApproved } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await requireApproved();
    if (!session.roles.includes('admin')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get('startDate');
    const endParam = searchParams.get('endDate');

    const defaultEnd = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() - 30);
    defaultStart.setHours(0,0,0,0);

    const startDate = startParam ? new Date(startParam) : defaultStart;
    const endDate = endParam ? new Date(endParam) : defaultEnd;
    endDate.setHours(23, 59, 59, 999);

    const orders = await db.order.findMany({
      where: { created_at: { gte: startDate, lte: endDate } },
      include: { category: true, branch: true },
      orderBy: { created_at: 'desc' }
    });

    const headers = ["Invoice Number", "Customer", "Category", "Branch", "Status", "Priority", "Created At", "Updated At", "Due Date"];
    const rows = orders.map(o => [
      o.invoice_number,
      o.customer_name,
      o.category?.name || '',
      o.branch?.name || '',
      o.status,
      o.priority,
      new Date(o.created_at).toLocaleString('en-GB'),
      new Date(o.updated_at).toLocaleString('en-GB'),
      o.due_date ? new Date(o.due_date).toLocaleString('en-GB') : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(str => `"${String(str).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="factory_orders_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
