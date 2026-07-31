import { requireApproved } from "@/lib/auth";
import { OrderDetail } from "@/components/orders/OrderDetail";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireApproved();
  const p = await params;
  
  const order = await db.order.findUnique({
    where: { id: p.id },
    include: {
      category: true,
      branch: true,
      current_stage: true,
      current_assignee: { select: { id: true, full_name: true } },
      history: {
        include: {
          actor: { select: { full_name: true } },
          assigned_to: { select: { full_name: true } },
          stage: true
        },
        orderBy: { created_at: 'desc' }
      }
    }
  });

  if (!order) {
    notFound();
  }

  // Fetch the specific version of stages for this order
  const stages = await db.workflowStage.findMany({
    where: { category_id: order.category_id, version: order.workflow_version },
    orderBy: { order_index: 'asc' }
  });

  // Inject stages into category object so OrderDetail works seamlessly
  const orderWithStages = {
    ...order,
    category: {
      ...order.category,
      stages
    }
  };

  const isAdmin = session.roles.includes("admin") || session.roles.includes("reception");
  const isSupervisor = session.roles.includes("supervisor");
  const canAct = order.current_assignee_id === session.sub || isAdmin || isSupervisor;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/orders" className="btn" style={{ width: 'auto', padding: '8px', background: 'var(--border-light)', color: 'var(--text-primary)' }}>
          <ArrowRight size={20} />
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>تفاصيل الطلب: <span style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{order.invoice_number}</span></h1>
      </div>
      
      <OrderDetail order={orderWithStages} canAct={canAct} currentUserId={session.sub} isAdmin={isAdmin} />
    </div>
  );
}
