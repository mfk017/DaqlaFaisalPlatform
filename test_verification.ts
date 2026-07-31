import { PrismaClient } from '@prisma/client';
import { calculateTimeTracking, calculateEmployeeMetrics } from './src/lib/timeTracking';

const prisma = new PrismaClient();

async function main() {
  console.log('--- TIME TRACKING VERIFICATION ---');
  
  // Create a mock user
  const worker = await prisma.profile.create({
    data: {
      username: 'test_worker_' + Date.now(),
      email: 'worker' + Date.now() + '@test.com',
      full_name: 'Test Worker',
      password_hash: 'hash',
      approved: true
    }
  });

  // Create a mock category and stages
  const category = await prisma.category.create({
    data: { name: 'Test Category ' + Date.now() }
  });
  const branch = await prisma.branch.create({
    data: { name: 'Test Branch ' + Date.now() }
  });

  const stage1 = await prisma.workflowStage.create({
    data: { name: 'Stage 1', order_index: 1, category_id: category.id }
  });
  const stage2 = await prisma.workflowStage.create({
    data: { name: 'Stage 2', order_index: 2, category_id: category.id, is_quality: true }
  });

  // Create order
  const order = await prisma.order.create({
    data: {
      invoice_number: 'TEST-' + Date.now(),
      customer_name: 'John Doe',
      category_id: category.id,
      branch_id: branch.id,
      current_stage_id: stage1.id,
      current_assignee_id: worker.id,
      status: 'completed',
      priority: 'normal'
    }
  });

  const now = Date.now();
  
  // Simulate order history
  const historyData = [
    {
      order_id: order.id,
      stage_id: stage1.id, // Stage 1
      actor_id: worker.id,
      action: 'created',
      created_at: new Date(now - 10 * 60 * 60 * 1000) // 10 hours ago
    },
    {
      order_id: order.id,
      stage_id: stage1.id, // Handed off FROM stage 1
      actor_id: worker.id,
      assigned_to_id: worker.id,
      action: 'handed_off',
      created_at: new Date(now - 8 * 60 * 60 * 1000) // 8 hours ago (Stage 1 took 2 hours)
    },
    {
      order_id: order.id,
      stage_id: stage2.id, // Returned FROM stage 2
      actor_id: worker.id,
      assigned_to_id: worker.id,
      action: 'returned',
      created_at: new Date(now - 7 * 60 * 60 * 1000) // 7 hours ago (Stage 2 took 1 hour)
    },
    {
      order_id: order.id,
      stage_id: stage1.id, // Handed off FROM stage 1 again
      actor_id: worker.id,
      assigned_to_id: worker.id,
      action: 'handed_off',
      created_at: new Date(now - 4 * 60 * 60 * 1000) // 4 hours ago (Stage 1 rework took 3 hours)
    },
    {
      order_id: order.id,
      stage_id: stage2.id, // Completed FROM stage 2
      actor_id: worker.id,
      action: 'completed',
      created_at: new Date(now - 2 * 60 * 60 * 1000) // 2 hours ago (Stage 2 final took 2 hours)
    }
  ];

  await prisma.orderHistory.createMany({ data: historyData });

  // 1. TIME TRACKING VERIFICATION
  const history = await prisma.orderHistory.findMany({
    where: { order_id: order.id },
    include: { stage: true },
    orderBy: { created_at: 'asc' }
  });

  const timeTracking = calculateTimeTracking(order, history);
  console.log('\nCalculated Lead Time (Total):', timeTracking.total_lead_time_ms / (1000 * 60 * 60), 'hours');
  console.log('Expected: 8 hours (10 hours ago to 2 hours ago)');
  console.log('\nStage Durations:');
  Object.entries(timeTracking.stage_durations).forEach(([stageId, durationMs]) => {
    const stageName = stageId === stage1.id ? 'Stage 1' : stageId === stage2.id ? 'Stage 2' : stageId;
    console.log(`- ${stageName}: ${durationMs / (1000 * 60 * 60)} hours`);
  });
  console.log('Expected: Stage 1 = 5 hours (2 + 3), Stage 2 = 3 hours (1 + 2)');
  console.log('\nRework Count:', timeTracking.rework_count);
  console.log('Expected: 1');

  // 2. QC PASS RATE VERIFICATION
  console.log('\n--- QC PASS RATE VERIFICATION ---');
  
  const mockQCHistory = [];
  let baseTime = now - 20 * 60 * 60 * 1000;
  
  // 8 Passes (hand off, no return) -> 8 attempts
  for (let i = 0; i < 8; i++) {
    const orderId = 'pass_' + i;
    mockQCHistory.push({
      action: 'created', // Start event
      assigned_to_id: worker.id,
      created_at: new Date(baseTime + i * 1000 - 5000), 
      order_id: orderId,
      stage: { name: 'Mock Stage' }
    });
    mockQCHistory.push({
      action: 'handed_off',
      actor_id: worker.id,
      created_at: new Date(baseTime + i * 1000),
      order_id: orderId,
      stage: { name: 'Mock Stage' }
    });
  }

  // 2 Returns -> 2 attempts (first try, failed)
  // Let's say they haven't fixed it yet, or someone else fixed it.
  for (let i = 0; i < 2; i++) {
    const orderId = 'fail_' + i;
    mockQCHistory.push({
      action: 'created',
      assigned_to_id: worker.id,
      created_at: new Date(baseTime + 10000 + i * 1000 - 5000),
      order_id: orderId,
      stage: { name: 'Mock Stage' }
    });
    mockQCHistory.push({
      action: 'handed_off',
      actor_id: worker.id,
      created_at: new Date(baseTime + 10000 + i * 1000),
      order_id: orderId,
      stage: { name: 'Mock Stage' }
    });
    mockQCHistory.push({
      action: 'returned',
      actor_id: 'some_qc_person',
      assigned_to_id: worker.id, // Returned back to our worker
      created_at: new Date(baseTime + 20000 + i * 1000),
      order_id: orderId,
      stage: { name: 'Mock QC Stage' }
    });
  }

  mockQCHistory.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());

  const employeeMetrics = calculateEmployeeMetrics(worker.id, mockQCHistory as any);
  
  const totalAttempts = employeeMetrics.completedTasksCount;
  const successfulAttempts = totalAttempts - employeeMetrics.reworkCount;
  const qcPassRate = totalAttempts > 0 
    ? Math.round((successfulAttempts / totalAttempts) * 100) 
    : 100;

  console.log('\nEmployee Metrics:');
  console.log('Passed Tasks (No rework):', successfulAttempts);
  console.log('Returned Tasks (Rework):', employeeMetrics.reworkCount);
  console.log('Total Attempts (Handoffs):', totalAttempts);
  console.log('QC Pass Rate (First Time Right):', qcPassRate + '%');
  console.log('Expected: 10 Total, 2 Returned, 8 Passed, 80% Pass Rate');

}

main().catch(console.error).finally(() => prisma.$disconnect());
