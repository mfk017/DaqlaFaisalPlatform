import { requireAdmin } from "@/lib/auth";
import { WorkflowBuilder } from "@/components/admin/WorkflowBuilder";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function WorkflowBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const p = await params;
  
  const category = await db.category.findUnique({
    where: { id: p.id }
  });

  if (!category) {
    notFound();
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/admin/categories" className="btn" style={{ width: 'auto', padding: '8px', background: 'var(--border-light)', color: 'var(--text-primary)' }}>
          <ArrowRight size={20} />
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>بناء المسار: {category.name}</h1>
      </div>
      
      <WorkflowBuilder categoryId={category.id} />
    </div>
  );
}
