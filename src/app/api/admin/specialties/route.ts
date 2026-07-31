import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    const specialties = await db.specialty.findMany({
      orderBy: { created_at: 'asc' }
    });
    return NextResponse.json({ specialties });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { name, label } = await req.json();

    if (!name || !label) {
      return NextResponse.json({ error: 'Name and label are required' }, { status: 400 });
    }

    const exists = await db.specialty.findUnique({ where: { name } });
    if (exists) {
      return NextResponse.json({ error: 'Specialty with this name already exists' }, { status: 400 });
    }

    const specialty = await db.specialty.create({
      data: { name, label }
    });

    return NextResponse.json({ specialty });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
