const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  console.log('Reading JSON dump...');
  const data = JSON.parse(fs.readFileSync('./data_dump.json', 'utf8'));

  try {
    // 1. Import Profiles
    console.log('Importing profiles...');
    for (const p of data.profiles) {
      await prisma.profile.upsert({
        where: { email: p.email },
        update: {},
        create: {
          id: p.id,
          email: p.email,
          username: p.username,
          full_name: p.full_name,
          password_hash: p.password_hash,
          approved: p.approved === 1,
          created_at: new Date(p.created_at),
          updated_at: new Date(p.updated_at),
        }
      });
    }

    // 2. Import Roles
    console.log('Importing roles...');
    for (const r of data.user_roles) {
      await prisma.userRole.upsert({
        where: { id: r.id },
        update: {},
        create: {
          id: r.id,
          profile_id: r.profile_id,
          role: r.role,
          specialty: r.specialty
        }
      });
    }

    // 3. Import Branches
    console.log('Importing branches...');
    for (const b of data.branches) {
      await prisma.branch.upsert({
        where: { name: b.name },
        update: {},
        create: {
          id: b.id,
          name: b.name,
          is_active: b.is_active === 1,
          is_archived: b.is_archived === 1,
          created_at: new Date(b.created_at),
          updated_at: new Date(b.updated_at),
        }
      });
    }

    // 4. Import Categories
    console.log('Importing categories...');
    for (const c of data.categories) {
      await prisma.category.upsert({
        where: { name: c.name },
        update: {},
        create: {
          id: c.id,
          name: c.name,
          is_active: c.is_active === 1,
          is_archived: c.is_archived === 1,
          current_version: c.current_version,
          created_at: new Date(c.created_at),
          updated_at: new Date(c.updated_at),
        }
      });
    }

    // 5. Import Workflow Stages
    console.log('Importing workflow stages...');
    for (const s of data.workflow_stages) {
      await prisma.workflowStage.upsert({
        where: { id: s.id },
        update: {},
        create: {
          id: s.id,
          category_id: s.category_id,
          version: s.version,
          name: s.name,
          order_index: s.order_index,
          is_quality: s.is_quality === 1,
          is_final: s.is_final === 1,
          is_archived: s.is_archived === 1,
          allowed_role: s.allowed_role,
          allowed_specialty: s.allowed_specialty,
          estimated_hours: s.estimated_hours,
          created_at: new Date(s.created_at),
          updated_at: new Date(s.updated_at),
        }
      });
    }

    // 6. Import Orders
    console.log('Importing orders...');
    for (const o of data.orders) {
      await prisma.order.upsert({
        where: { invoice_number: o.invoice_number },
        update: {},
        create: {
          id: o.id,
          invoice_number: o.invoice_number,
          customer_name: o.customer_name,
          category_id: o.category_id,
          workflow_version: o.workflow_version,
          branch_id: o.branch_id,
          current_stage_id: o.current_stage_id,
          current_assignee_id: o.current_assignee_id,
          status: o.status,
          priority: o.priority,
          due_date: o.due_date ? new Date(o.due_date) : null,
          cancel_reason: o.cancel_reason,
          canceled_at: o.canceled_at ? new Date(o.canceled_at) : null,
          created_at: new Date(o.created_at),
          updated_at: new Date(o.updated_at),
        }
      });
    }

    // 7. Import Order History
    console.log('Importing order history...');
    for (const h of data.order_history) {
      await prisma.orderHistory.upsert({
        where: { id: h.id },
        update: {},
        create: {
          id: h.id,
          order_id: h.order_id,
          stage_id: h.stage_id,
          actor_id: h.actor_id,
          assigned_to_id: h.assigned_to_id,
          action: h.action,
          notes: h.notes,
          image_url: h.image_url,
          created_at: new Date(h.created_at),
        }
      });
    }

    console.log('Migration complete!');
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
