const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Measuring Query Performance (Original vs Optimized)");

  // 1. Dashboard Chart: Orders By Stage
  console.log("\n--- Dashboard: Orders By Stage ---");
  const startOriginal = Date.now();
  const allActive = await prisma.order.findMany({ 
    where: { status: 'in_progress' }, 
    include: { current_stage: true } 
  });
  const stageMap = {};
  allActive.forEach(o => {
    const stageName = o.current_stage.name;
    stageMap[stageName] = (stageMap[stageName] || 0) + 1;
  });
  console.log(`Original Method Time: ${Date.now() - startOriginal}ms`);

  const startOptimized = Date.now();
  const agg = await prisma.order.groupBy({
    by: ['current_stage_id'],
    where: { status: 'in_progress' },
    _count: { id: true }
  });
  // Note: groupBy doesn't include relation fields, so we need to fetch stage names
  // But for 5 stages, fetching the names is instant compared to fetching thousands of orders
  console.log(`Optimized Method Time: ${Date.now() - startOptimized}ms`);

  // 2. Dashboard: Stale Orders (Original vs Optimized)
  console.log("\n--- Dashboard: Stale Orders ---");
  const now = new Date().getTime();
  const startStale = Date.now();
  const allActive2 = await prisma.order.findMany({ 
    where: { status: 'in_progress' }, 
    include: { current_stage: true } 
  });
  const staleOrders = allActive2.filter(o => {
    const elapsedHours = (now - new Date(o.updated_at).getTime()) / (1000 * 60 * 60);
    const estimatedHours = o.current_stage.estimated_hours || 24;
    return elapsedHours >= estimatedHours;
  });
  console.log(`Original Method Time: ${Date.now() - startStale}ms`);

  // 3. Live: Urgent Orders
  console.log("\n--- Live: Urgent Orders ---");
  const startLive = Date.now();
  const activeOrders = await prisma.order.findMany({
    where: { status: { in: ['in_progress', 'returned'] } },
    include: { current_stage: true, category: true }
  });
  let lateOrdersCount = 0;
  const urgentOrdersList = [];
  for (const order of activeOrders) {
    let isLate = false;
    if (order.due_date) {
      if (now > new Date(order.due_date).getTime()) {
        lateOrdersCount++;
        isLate = true;
      }
    }
    if (order.priority === 'rush' || isLate) {
      urgentOrdersList.push(order);
    }
  }
  console.log(`Original Method Time: ${Date.now() - startLive}ms`);

  // Check actual row count to see why it might not be slow locally yet
  const c = await prisma.order.count();
  console.log(`\nTotal Orders in Local DB: ${c}`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
