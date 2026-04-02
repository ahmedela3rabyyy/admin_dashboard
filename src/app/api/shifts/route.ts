import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ NEW: فك التوكن لاستخراج storeId الحقيقي وليس مجرد النص المشفر
    const { verifyToken } = await import('@/lib/auth');
    const decoded = await verifyToken(token);
    
    if (!decoded || !decoded.storeId) {
      return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
    }

    const storeId = decoded.storeId;

    const shifts = await prisma.shift.findMany({
      where: { storeId },
      include: {
        user: {
          select: {
            fullName: true,
            username: true,
            role: true
          }
        },
        sales: {
          include: {
            items: {
              include: {
                product: {
                    select: { name: true }
                }
              }
            },
            returns: {
                select: {
                    id: true,
                    totalRefund: true,
                    returnDate: true
                }
            }
          },
          orderBy: {
            invoiceDate: 'desc'
          }
        },
        expenses: {
          select: {
            id: true,
            title: true,
            amount: true,
            expenseType: true,
            expenseDate: true
          }
        },
        saleReturns: {
            select: {
                id: true,
                totalRefund: true,
                returnDate: true
            }
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    return NextResponse.json(shifts);
  } catch (error: any) {
    console.error('API /api/shifts Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
