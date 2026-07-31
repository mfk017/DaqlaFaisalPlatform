import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApproved } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApproved();
    const p = await params;
    
    // Parse FormData instead of JSON
    const formData = await req.formData();
    const action = formData.get('action') as string;
    const next_stage_id = formData.get('next_stage_id') as string | null;
    const next_assignee_id = formData.get('next_assignee_id') as string | null;
    const notes = formData.get('notes') as string | null;
    
    // Handle File Upload
    const file = formData.get('image');
    let image_url = null;
    if (file && typeof file === 'object' && 'arrayBuffer' in file) {
      try {
        const f = file as File;
        if (f.size > 0) {
          const bytes = await f.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const filename = `${Date.now()}_${f.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
          const uploadDir = path.join(process.cwd(), 'public/uploads/history');
          await require('fs/promises').mkdir(uploadDir, { recursive: true });
          const filepath = path.join(uploadDir, filename);
          await writeFile(filepath, buffer);
          image_url = `/api/uploads/${filename}`;
        }
      } catch (uploadErr) {
        console.error("Failed to upload image:", uploadErr);
        // We will continue the hand-off even if the image fails, but log the error.
      }
    }
    
    // Find the order
    const order = await db.order.findUnique({
      where: { id: p.id },
      include: { current_stage: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only current assignee, admin, or reception can hand-off
    if (order.current_assignee_id !== session.sub && !session.roles.includes('admin') && !session.roles.includes('reception')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.$transaction(async (tx) => {
      if (action === 'complete') {
        await tx.order.update({
          where: { id: p.id },
          data: { status: 'completed' }
        });
        await tx.orderHistory.create({
          data: {
            order_id: p.id,
            stage_id: order.current_stage_id,
            actor_id: session.sub,
            action: 'completed',
            notes: notes || 'تم التسليم النهائي',
            image_url
          }
        });
      } else if (action === 'hand_off') {
        if (!next_stage_id || !next_assignee_id) throw new Error('Missing hand-off data');
        await tx.order.update({
          where: { id: p.id },
          data: {
            current_stage_id: next_stage_id,
            current_assignee_id: next_assignee_id,
            status: 'in_progress'
          }
        });
        await tx.orderHistory.create({
          data: {
            order_id: p.id,
            stage_id: order.current_stage_id,
            actor_id: session.sub,
            assigned_to_id: next_assignee_id,
            action: 'handed_off',
            notes: notes,
            image_url
          }
        });
      } else if (action === 'return') {
        if (!next_stage_id || !next_assignee_id) throw new Error('Missing return data');
        await tx.order.update({
          where: { id: p.id },
          data: {
            current_stage_id: next_stage_id,
            current_assignee_id: next_assignee_id,
            status: 'returned'
          }
        });
        await tx.orderHistory.create({
          data: {
            order_id: p.id,
            stage_id: order.current_stage_id, 
            actor_id: session.sub,
            assigned_to_id: next_assignee_id,
            action: 'returned',
            notes: notes || 'مرفوض من الجودة',
            image_url
          }
        });
      } else if (action === 'cancel') {
        if (!notes) throw new Error('سبب الإلغاء مطلوب');
        if (!session.roles.includes('admin') && !session.roles.includes('reception')) {
          throw new Error('غير مصرح لك بإلغاء الطلب');
        }
        await tx.order.update({
          where: { id: p.id },
          data: { 
            status: 'canceled', 
            cancel_reason: notes,
            canceled_at: new Date()
          }
        });
        await tx.orderHistory.create({
          data: {
            order_id: p.id,
            stage_id: order.current_stage_id,
            actor_id: session.sub,
            action: 'returned', // Map to returned or created, we don't have canceled action in history, maybe 'returned' works as a generic alert
            notes: `تم إلغاء الطلب: ${notes}`,
            image_url
          }
        });
      } else if (action === 'add_note') {
        await tx.orderHistory.create({
          data: {
            order_id: p.id,
            stage_id: order.current_stage_id,
            actor_id: session.sub,
            action: 'added_note',
            notes: notes || 'تمت إضافة ملاحظة / مرفق',
            image_url
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
