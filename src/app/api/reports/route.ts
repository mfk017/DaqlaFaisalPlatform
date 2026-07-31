import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApproved } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await requireApproved();
    if (!session.roles.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get('startDate');
    const endParam = searchParams.get('endDate');

    // Default to last 30 days if no dates provided
    const defaultEnd = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() - 30);
    defaultStart.setHours(0,0,0,0);

    const startDate = startParam ? new Date(startParam) : defaultStart;
    const endDate = endParam ? new Date(endParam) : defaultEnd;
    endDate.setHours(23, 59, 59, 999); // Include entire end date

    // Fetch raw data within date range
    const [allOrders, activeOrders, allHistory] = await Promise.all([
      db.order.findMany({ 
        where: { created_at: { gte: startDate, lte: endDate } },
        include: { category: true, branch: true } 
      }),
      db.order.findMany({ 
        where: { status: { in: ['in_progress', 'returned'] }, created_at: { gte: startDate, lte: endDate } },
        include: { current_stage: true, category: true }
      }),
      db.orderHistory.findMany({
        where: { action: 'returned', created_at: { gte: startDate, lte: endDate } },
        include: { stage: true, assigned_to: true }
      })
    ]);

    // 1. WIP by Stage
    const wipMap: Record<string, number> = {};
    activeOrders.forEach(o => {
      const stage = o.current_stage.name;
      wipMap[stage] = (wipMap[stage] || 0) + 1;
    });
    const wipByStage = Object.entries(wipMap).map(([name, count]) => ({ name, count }));

    // 2. Status Breakdown
    let inP = 0, ret = 0, comp = 0, canc = 0;
    allOrders.forEach(o => {
      if(o.status === 'in_progress') inP++;
      if(o.status === 'returned') ret++;
      if(o.status === 'completed') comp++;
      if(o.status === 'canceled') canc++;
    });
    const statusBreakdown = [
      { name: 'جاري التنفيذ', value: inP, color: '#E8A33D' },
      { name: 'مرفوض/معاد', value: ret, color: '#E85C4A' },
      { name: 'منجز', value: comp, color: '#3FBF7F' },
      { name: 'ملغي', value: canc, color: '#2A2E37' }
    ];

    // 3. Defect Metrics & First-Pass Yield
    const returnedOrderIds = new Set(allHistory.map(h => h.order_id));
    const defectRate = allOrders.length > 0 ? (returnedOrderIds.size / allOrders.length) * 100 : 0;
    
    // First-Pass Yield = (Completed without returns / Total Completed) * 100
    let totalCompleted = 0;
    let completedWithoutReturns = 0;
    allOrders.forEach(o => {
      if (o.status === 'completed') {
        totalCompleted++;
        if (!returnedOrderIds.has(o.id)) {
          completedWithoutReturns++;
        }
      }
    });
    const firstPassYield = totalCompleted > 0 ? (completedWithoutReturns / totalCompleted) * 100 : 0;

    const defectStageMap: Record<string, number> = {};
    allHistory.forEach(h => {
      const stageName = h.stage.name;
      defectStageMap[stageName] = (defectStageMap[stageName] || 0) + 1;
    });
    const defectOrigin = Object.entries(defectStageMap).map(([name, count]) => ({ name, count })).sort((a,b)=> b.count - a.count);

    // 4. Cycle Time (Overall, by Category, by Branch)
    let totalCycleTimeMs = 0;
    const catCycle: Record<string, { sum: number, count: number }> = {};
    const branchCycle: Record<string, { sum: number, count: number }> = {};
    const catVol: Record<string, number> = {};
    const branchVol: Record<string, number> = {};

    allOrders.forEach(o => {
      catVol[o.category.name] = (catVol[o.category.name] || 0) + 1;
      branchVol[o.branch.name] = (branchVol[o.branch.name] || 0) + 1;

      if (o.status === 'completed') {
        const cycleTime = new Date(o.updated_at).getTime() - new Date(o.created_at).getTime();
        totalCycleTimeMs += cycleTime;
        
        if(!catCycle[o.category.name]) catCycle[o.category.name] = { sum: 0, count: 0 };
        catCycle[o.category.name].sum += cycleTime;
        catCycle[o.category.name].count++;

        if(!branchCycle[o.branch.name]) branchCycle[o.branch.name] = { sum: 0, count: 0 };
        branchCycle[o.branch.name].sum += cycleTime;
        branchCycle[o.branch.name].count++;
      }
    });

    const avgCycleTimeHours = totalCompleted > 0 ? (totalCycleTimeMs / totalCompleted) / (1000 * 60 * 60) : 0;

    const volumeByCategory = Object.entries(catVol).map(([name, count]) => {
      const cyc = catCycle[name];
      const avgH = cyc && cyc.count > 0 ? (cyc.sum / cyc.count) / (1000 * 60 * 60) : 0;
      return { name, count, avgCycleHours: parseFloat(avgH.toFixed(1)) };
    });

    const volumeByBranch = Object.entries(branchVol).map(([name, count]) => {
      const cyc = branchCycle[name];
      const avgH = cyc && cyc.count > 0 ? (cyc.sum / cyc.count) / (1000 * 60 * 60) : 0;
      return { name, count, avgCycleHours: parseFloat(avgH.toFixed(1)) };
    });

    // 5. Worker Performance
    const workerProfiles = await db.profile.findMany({
      where: { approved: true, roles: { some: { role: 'worker' } } },
      include: {
        _count: {
          select: { history_actions: true }
        },
        roles: true
      }
    });

    const workerPerformance = workerProfiles.map(p => {
      const workerRole = p.roles.find(r => r.role === 'worker');
      return {
        id: p.id,
        name: p.full_name,
        specialty: workerRole?.specialty || 'عام',
        completedTasks: p._count.history_actions
      };
    }).sort((a, b) => b.completedTasks - a.completedTasks);

    return NextResponse.json({
      headline: {
        totalOrders: allOrders.length,
        activeOrders: inP + ret,
        completedWithinRange: totalCompleted,
        firstPassYield: firstPassYield.toFixed(1),
        defectRate: defectRate.toFixed(1),
        avgCycleTimeHours: avgCycleTimeHours.toFixed(1)
      },
      charts: {
        wipByStage,
        statusBreakdown,
        defectOrigin,
        volumeByCategory,
        volumeByBranch,
        workerPerformance
      },
      raw: allOrders // Needed for CSV export
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
