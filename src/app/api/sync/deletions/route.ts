import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Desktop calls GET to check for web deletions
export async function GET(req: Request) {
  try {
    const storeId = req.headers.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const deletions = await prisma.webDeletion.findMany({
      where: { storeId, confirmed: false },
    });

    return NextResponse.json({ deletions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Desktop confirms it applied the deletions
export async function POST(req: Request) {
  try {
    const storeId = req.headers.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { ids } = await req.json();
    if (Array.isArray(ids) && ids.length > 0) {
      await prisma.webDeletion.updateMany({
        where: { id: { in: ids }, storeId },
        data: { confirmed: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
