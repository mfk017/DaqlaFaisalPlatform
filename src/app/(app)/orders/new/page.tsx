import { requireApproved } from "@/lib/auth";
import { OrderIntakeForm } from "@/components/orders/OrderIntakeForm";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function NewOrderPage() {
  const session = await requireApproved();
  if (!session.roles.includes("admin") && !session.roles.includes("reception")) {
    redirect("/orders");
  }

  const [categories, branches] = await Promise.all([
    db.category.findMany({ where: { is_active: true }, include: { stages: { orderBy: { order_index: 'asc' } } } }),
    db.branch.findMany({ orderBy: { name: 'asc' } })
  ]);

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>استلام طلب جديد</h1>
      <OrderIntakeForm categories={categories} branches={branches} />
    </div>
  );
}
