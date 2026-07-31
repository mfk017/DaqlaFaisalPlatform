import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function testVersioning() {
  console.log('--- STARTING VERSIONING TEST ---');
  
  // 1. Create a Category
  const category = await db.category.create({
    data: { name: 'Test Versioning Category', is_active: true }
  });
  console.log('Created Category:', category.id);

  // 2. Add Stages for Version 1
  const stage1 = await db.workflowStage.create({
    data: { category_id: category.id, name: 'Stage 1', order_index: 1, is_quality: false, is_final: false, version: 1 }
  });
  const stage2 = await db.workflowStage.create({
    data: { category_id: category.id, name: 'Stage 2', order_index: 2, is_quality: true, is_final: true, version: 1 }
  });
  console.log('Created Stages V1:', stage1.id, stage2.id);

  // 3. Create a Branch and Assignee
  const branch = await db.branch.create({ data: { name: 'Test Branch' } });
  const assignee = await db.profile.findFirst();
  if (!assignee) throw new Error("No profiles exist");

  // 4. Create an Order on Version 1
  const order = await db.order.create({
    data: {
      invoice_number: `TEST-${Date.now()}`,
      customer_name: 'Test Customer',
      category_id: category.id,
      workflow_version: 1,
      branch_id: branch.id,
      current_stage_id: stage1.id,
      current_assignee_id: assignee.id
    }
  });
  console.log('Created Order on V1:', order.id);

  // 5. Admin modifies the workflow (simulate PUT /api/admin/categories/[id]/stages/[stageId] delete)
  const nextVersion = 2;
  await db.$transaction(async (tx) => {
    // We only copy stage2 (so stage1 is "deleted" in V2)
    await tx.workflowStage.create({
      data: {
        category_id: category.id,
        version: nextVersion,
        name: stage2.name,
        order_index: 1, // now it's the first stage
        is_quality: stage2.is_quality,
        is_final: stage2.is_final
      }
    });

    await tx.category.update({
      where: { id: category.id },
      data: { current_version: nextVersion }
    });
  });
  console.log('Admin deleted Stage 1. Category bumped to V2.');

  // 6. Verify the Order survived and still has Stage 1
  const savedOrder = await db.order.findUnique({
    where: { id: order.id },
    include: { current_stage: true }
  });

  const orderStages = await db.workflowStage.findMany({
    where: { category_id: category.id, version: savedOrder?.workflow_version }
  });

  console.log('Order current stage name:', savedOrder?.current_stage.name);
  console.log('Order workflow_version:', savedOrder?.workflow_version);
  console.log('Stages available to this order:', orderStages.map(s => s.name));
  
  if (savedOrder?.current_stage.name === 'Stage 1' && orderStages.length === 2) {
    console.log('✅ TEST PASSED: The existing order perfectly survived the deletion and retains its original workflow version!');
  } else {
    console.log('❌ TEST FAILED');
  }
}

testVersioning().catch(console.error).finally(() => db.$disconnect());
