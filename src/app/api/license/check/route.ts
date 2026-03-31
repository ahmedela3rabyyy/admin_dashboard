import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// سر الأدمن — نفس القيمة في KeyGeneratorApp
const ADMIN_SECRET = 'Kz2v9mX5qR8wT7yP1oN4mL7kH6jG5fD3sA2qW1eR4tY=';

function isAdmin(req: Request) {
  return req.headers.get('x-admin-secret') === ADMIN_SECRET;
}

// GET /api/license/check?machine_id=XXX  → يفحص هل الجهاز محظور
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const machineId = searchParams.get('machine_id');
    if (!machineId) return NextResponse.json({ blocked: false });

    const blocked = await prisma.blockedDevice.findUnique({ where: { machineId } });

    if (blocked) {
      return NextResponse.json({
        blocked: true,
        reason: blocked.reason || 'تم إيقاف هذا البرنامج. تواصل مع المطور: 01145333606'
      });
    }
    return NextResponse.json({ blocked: false });
  } catch {
    return NextResponse.json({ blocked: false }); // في خطأ → لا نوقف البرنامج
  }
}

// POST /api/license/check  → حظر جهاز (Admin only)
export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { machineId, reason } = await req.json();
  if (!machineId) return NextResponse.json({ error: 'machineId required' }, { status: 400 });

  await prisma.blockedDevice.upsert({
    where: { machineId },
    update: { reason, blockedAt: new Date() },
    create: { machineId, reason, blockedAt: new Date() }
  });
  return NextResponse.json({ success: true, action: 'blocked', machineId });
}

// DELETE /api/license/check  → رفع الحظر (Admin only)
export async function DELETE(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { machineId } = await req.json();
  await prisma.blockedDevice.delete({ where: { machineId } }).catch(() => {});
  return NextResponse.json({ success: true, action: 'unblocked', machineId });
}
