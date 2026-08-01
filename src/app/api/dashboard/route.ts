import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApproved } from '@/lib/auth';
import { getT } from '@/lib/i18n';

export async function GET(req: Request) {
  const t = await getT();

  try {
    const session = await requireApproved();
    const isAdmin = session.roles.includes('admin');
    const isReception = session.roles.includes('reception');
    const isQuality = session.roles.includes('quality');
    
    // Base Response Object
    const responseData: any = {
      roles: session.roles,
      my_tasks: [],
      intake: [],
      qualityQueue: [],
      staleOrders: [],
      activityFeed: [],
      charts: {},
      metrics: {}
    };

    // 1. My Tasks (For everyone)
    responseData.my_tasks = await db.order.findMany({
      where: { current_assignee_id: session.sub, status: { in: ['in_progress', 'returned'] } },
      include: { category: true, branch: true, current_stage: true },
      orderBy: { updated_at: 'desc' },
      take: 20
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2. Intake (For Admin & Reception)
    if (isAdmin || isReception) {
      responseData.intake = await db.order.findMany({
        where: { created_at: { gte: today } },
        include: { category: true, current_stage: true, current_assignee: { select: { full_name: true } } },
        orderBy: { created_at: 'desc' },
        take: 50
      });
    }

    // 3. Quality Queue (For Admin & Quality)
    if (isAdmin || isQuality) {
      responseData.qualityQueue = await db.order.findMany({
        where: { current_stage: { is_quality: true }, status: 'in_progress' },
        include: { category: true, current_stage: true, current_assignee: { select: { full_name: true } } },
        orderBy: { created_at: 'asc' },
        take: 50
      });
    }

    // 4. Admin only (Stale Orders, Activity Feed, Charts)
    if (isAdmin) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);
      sevenDaysAgo.setHours(0,0,0,0);

      // Perform fast counts and aggregations on the DB instead of fetching all orders
      const [
        activeCount, 
        returnedCount, 
        completedTodayCount, 
        activity,
        ordersByStageAgg,
        ordersByCategoryAgg,
        statusGroupAgg,
        recentCompletedOrders
      ] = await Promise.all([
        db.order.count({ where: { status: 'in_progress' } }),
        db.order.count({ where: { status: 'returned' } }),
        db.order.count({ where: { status: 'completed', updated_at: { gte: today } } }),
        db.orderHistory.findMany({
          where: { action: { in: ['handed_off', 'completed', 'returned', 'canceled'] } },
          include: { 
            order: { select: { invoice_number: true, id: true } },
            actor: { select: { full_name: true } },
            assigned_to: { select: { full_name: true } },
            stage: { select: { name: true } }
          },
          orderBy: { created_at: 'desc' },
          take: 30
        }),
        // Group by stage
        db.order.groupBy({
          by: ['current_stage_id'],
          where: { status: 'in_progress' },
          _count: { id: true }
        }),
        // Group by category
        db.order.groupBy({
          by: ['category_id'],
          _count: { id: true }
        }),
        // Group by status
        db.order.groupBy({
          by: ['status'],
          _count: { id: true }
        }),
        // For completion trend (last 7 days), just fetch id and updated_at
        db.order.findMany({
          where: { status: 'completed', updated_at: { gte: sevenDaysAgo } },
          select: { updated_at: true }
        })
      ]);

      responseData.activityFeed = activity;
      responseData.metrics = {
        active: activeCount,
        returned: returnedCount,
        completed_today: completedTodayCount
      };

      // We still need stage names and category names for the charts.
      // Fetching small lists of stages/categories is extremely fast.
      const [stages, categories] = await Promise.all([
        db.workflowStage.findMany({ select: { id: true, name: true } }),
        db.category.findMany({ select: { id: true, name: true } })
      ]);
      const stageNameMap = Object.fromEntries(stages.map(s => [s.id, s.name]));
      const catNameMap = Object.fromEntries(categories.map(c => [c.id, c.name]));

      responseData.charts.ordersByStage = ordersByStageAgg.map(agg => ({
        name: stageNameMap[agg.current_stage_id] || 'Unknown',
        count: agg._count.id
      }));

      responseData.charts.ordersByCategory = ordersByCategoryAgg.map(agg => ({
        name: catNameMap[agg.category_id] || 'Unknown',
        count: agg._count.id
      }));

      // Completion Trend (Last 7 days)
      const trendMap: Record<string, number> = {};
      for(let i=0; i<7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        const dateStr = d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
        trendMap[dateStr] = 0;
      }
      recentCompletedOrders.forEach(o => {
        const dateStr = new Date(o.updated_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
        if (trendMap[dateStr] !== undefined) trendMap[dateStr]++;
      });
      responseData.charts.completionTrend = Object.entries(trendMap).map(([date, count]) => ({ date, count }));

      // Status Breakdown
      const statusMap = Object.fromEntries(statusGroupAgg.map(agg => [agg.status, agg._count.id]));
      responseData.charts.ordersByStatus = [
        { name: t("executing"), value: statusMap['in_progress'] || 0, color: '#E8A33D' },
        { name: t("rejected_returned"), value: statusMap['returned'] || 0, color: '#E85C4A' },
        { name: t("completed"), value: statusMap['completed'] || 0, color: '#3FBF7F' },
        { name: t("cancelled"), value: statusMap['canceled'] || 0, color: '#2A2E37' }
      ];

      // Stale Orders
      // We can't easily calculate business logic (elapsed >= estimated) in Prisma groupBy, 
      // but we CAN fetch only active orders with their stage, instead of ALL orders.
      // Actually `allActive` was only `in_progress` orders in the original, but pulling them all was still heavy if there are thousands.
      // We can fetch only the fields we need.
      const activeForStale = await db.order.findMany({
        where: { status: 'in_progress' },
        select: { id: true, invoice_number: true, updated_at: true, current_stage: { select: { name: true, estimated_hours: true } } }
      });
      const now = new Date().getTime();
      responseData.staleOrders = activeForStale.filter(o => {
        const elapsedHours = (now - new Date(o.updated_at).getTime()) / (1000 * 60 * 60);
        const estimatedHours = o.current_stage.estimated_hours || 24;
        return elapsedHours >= estimatedHours;
      }).map(o => ({
        id: o.id,
        invoice_number: o.invoice_number,
        stage_name: o.current_stage.name,
        estimated_hours: o.current_stage.estimated_hours || 24,
        elapsed_hours: Math.floor((now - new Date(o.updated_at).getTime()) / (1000 * 60 * 60))
      })).sort((a, b) => (b.elapsed_hours - b.estimated_hours) - (a.elapsed_hours - a.estimated_hours)).slice(0, 20);
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
