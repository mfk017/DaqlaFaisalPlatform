import { requireApproved } from "@/lib/auth";
import { OrderList } from "@/components/orders/OrderList";
import { getT } from "@/lib/i18n";

export default async function OrdersPage() {
  const session = await requireApproved();
  const t = await getT();
  const canCreate = session.roles.includes("admin") || session.roles.includes("reception");

  const isWorker = session.roles.includes("worker") && !session.roles.includes("admin");

  return (
    <div>
      <OrderList canCreate={canCreate} isWorker={isWorker} />
    </div>
  );
}
