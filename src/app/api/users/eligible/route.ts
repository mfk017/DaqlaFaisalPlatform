import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApproved } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await requireApproved();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const specialty = searchParams.get('specialty');

    const whereClause: any = { approved: true };
    
    // Apply role filters if they are provided in the query params
    if (role || specialty) {
      whereClause.roles = {
        some: {
          ...(role ? { role } : {}),
          ...(specialty ? { specialty } : {})
        }
      };
    }

    const users = await db.profile.findMany({
      where: whereClause,
      select: {
        id: true,
        full_name: true,
        roles: true
      }
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
