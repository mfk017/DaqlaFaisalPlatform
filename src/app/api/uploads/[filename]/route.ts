import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const p = await params;
    const filepath = path.join(process.cwd(), 'public/uploads/history', p.filename);
    
    if (!fs.existsSync(filepath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filepath);
    
    let contentType = 'image/jpeg';
    if (p.filename.endsWith('.png')) contentType = 'image/png';
    else if (p.filename.endsWith('.webp')) contentType = 'image/webp';
    else if (p.filename.endsWith('.gif')) contentType = 'image/gif';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
