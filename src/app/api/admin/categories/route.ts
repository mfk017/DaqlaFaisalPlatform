import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    const categories = await db.category.findMany({
      include: {
        _count: {
          select: { stages: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { name } = await req.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const category = await db.category.create({
      data: { name: name.trim() }
    });

    return NextResponse.json({ category });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
