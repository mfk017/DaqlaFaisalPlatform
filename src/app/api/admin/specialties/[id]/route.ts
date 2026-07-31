import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const p = await params;
    const { name, label } = await req.json();

    if (!name || !label) {
      return NextResponse.json({ error: 'Name and label are required' }, { status: 400 });
    }

    const specialty = await db.specialty.update({
      where: { id: p.id },
      data: { name, label }
    });

    return NextResponse.json({ specialty });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const p = await params;
    
    await db.specialty.delete({
      where: { id: p.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
