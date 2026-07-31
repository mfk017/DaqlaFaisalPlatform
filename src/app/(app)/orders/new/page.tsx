import { requireApproved } from "@/lib/auth";
import { OrderIntakeForm } from "@/components/orders/OrderIntakeForm";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function NewOrderPage() {
  const session = await requireApproved();
  if (!session.roles.includes("admin") && !session.roles.includes("reception")) {
    redirect("/orders");
  }

  const categoriesRaw = await db.category.findMany({ where: { is_active: true, is_archived: false } });
  
  // For each category, we need to fetch ONLY the stages matching its current_version
  const categories = await Promise.all(categoriesRaw.map(async (c) => {
    const stages = await db.workflowStage.findMany({
      where: { category_id: c.id, version: c.current_version },
      orderBy: { order_index: 'asc' }
    });
    return { ...c, stages };
  }));

  const branches = await db.branch.findMany({ where: { is_archived: false }, orderBy: { name: 'asc' } });

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>استلام طلب جديد</h1>
      <OrderIntakeForm categories={categories} branches={branches} />
    </div>
  );
}
