import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApproved } from '@/lib/auth';

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

      const [allActive, allOrders, activeCount, returnedCount, completedTodayCount, activity] = await Promise.all([
        db.order.findMany({ where: { status: 'in_progress' }, include: { current_stage: true } }),
        db.order.findMany({ include: { category: true } }),
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
        })
      ]);

      responseData.activityFeed = activity;
      
      const now = new Date().getTime();
      responseData.staleOrders = allActive.filter(o => {
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

      responseData.metrics = {
        active: activeCount,
        returned: returnedCount,
        completed_today: completedTodayCount
      };

      // Aggregate Orders by Stage
      const stageMap: Record<string, number> = {};
      allActive.forEach(o => {
        const stageName = o.current_stage.name;
        stageMap[stageName] = (stageMap[stageName] || 0) + 1;
      });
      responseData.charts.ordersByStage = Object.entries(stageMap).map(([name, count]) => ({ name, count }));

      // Aggregate Orders by Category
      const categoryMap: Record<string, number> = {};
      allOrders.forEach(o => {
        const catName = o.category.name;
        categoryMap[catName] = (categoryMap[catName] || 0) + 1;
      });
      responseData.charts.ordersByCategory = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));

      // Completion Trend (Last 7 days)
      const trendMap: Record<string, number> = {};
      for(let i=0; i<7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        const dateStr = d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
        trendMap[dateStr] = 0;
      }
      allOrders.forEach(o => {
        if (o.status === 'completed' && o.updated_at >= sevenDaysAgo) {
          const dateStr = new Date(o.updated_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
          if (trendMap[dateStr] !== undefined) trendMap[dateStr]++;
        }
      });
      responseData.charts.completionTrend = Object.entries(trendMap).map(([date, count]) => ({ date, count }));

      // Status Breakdown
      let inP = 0, ret = 0, comp = 0, canc = 0;
      allOrders.forEach(o => {
        if(o.status === 'in_progress') inP++;
        if(o.status === 'returned') ret++;
        if(o.status === 'completed') comp++;
        if(o.status === 'canceled') canc++;
      });
      responseData.charts.ordersByStatus = [
        { name: t("executing"), value: inP, color: '#E8A33D' },
        { name: t("rejected_returned"), value: ret, color: '#E85C4A' },
        { name: t("completed"), value: comp, color: '#3FBF7F' },
        { name: t("cancelled"), value: canc, color: '#2A2E37' }
      ];
    }

    return NextResponse.json(responseData);
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
