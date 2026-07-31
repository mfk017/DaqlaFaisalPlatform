import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApproved } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await requireApproved();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const specialty = searchParams.get('specialty');

    const isAdminOrReception = session.roles.includes('admin') || session.roles.includes('reception');

    const whereClause: any = { approved: true };
    
    // Only apply role filters if the user is not admin/reception, OR if we want to default to filtering but maybe we shouldn't.
    // The request: "make the reception have the ability to make new order and according to the product ctegory iy will be assigned to wqho ever even himself"
    // We'll ignore the strict role/specialty filter if the creator is admin/reception.
    if (!isAdminOrReception && (role || specialty)) {
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
