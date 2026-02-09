import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NotificationType, Prisma } from '@prisma/client';

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const unreadOnly = searchParams.get('unread') === 'true';

        const where: Record<string, unknown> = {
            userId: parseInt(session.user.id),
        };

        if (unreadOnly) {
            where.isRead = false;
        }

        const [notifications, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),
            prisma.notification.count({
                where: {
                    userId: parseInt(session.user.id),
                    isRead: false,
                },
            }),
        ]);

        return NextResponse.json({
            notifications,
            unreadCount,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Bildirimler alınamadı' }, { status: 500 });
    }
}

// POST /api/notifications - Create notification (internal use)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        // Only admins/system can create notifications
        if (!['Admin', 'Supervisor'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const body = await request.json();
        const { userId, type, title, message, data } = body;

        if (!userId || !type || !title || !message) {
            return NextResponse.json(
                { error: 'userId, type, title ve message zorunludur' },
                { status: 400 }
            );
        }

        const notification = await prisma.notification.create({
            data: {
                userId,
                type: type as NotificationType,
                title,
                message,
                data: (data ?? Prisma.DbNull) as any,
            },
        });

        return NextResponse.json(notification, { status: 201 });
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json({ error: 'Bildirim oluşturulamadı' }, { status: 500 });
    }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { notificationIds, markAllRead } = body;

        if (markAllRead) {
            // Mark all as read
            await prisma.notification.updateMany({
                where: {
                    userId: parseInt(session.user.id),
                    isRead: false,
                },
                data: { isRead: true },
            });
        } else if (notificationIds && Array.isArray(notificationIds)) {
            // Mark specific notifications as read
            await prisma.notification.updateMany({
                where: {
                    id: { in: notificationIds },
                    userId: parseInt(session.user.id),
                },
                data: { isRead: true },
            });
        } else {
            return NextResponse.json(
                { error: 'notificationIds veya markAllRead gerekli' },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        return NextResponse.json({ error: 'Bildirimler güncellenemedi' }, { status: 500 });
    }
}

// Helper function to create notification (can be imported by other modules)
export async function createNotification(
    userId: number,
    type: string,
    title: string,
    message: string,
    data?: Record<string, unknown>
): Promise<void> {
    try {
        await prisma.notification.create({
            data: {
                userId,
                type: type as NotificationType,
                title,
                message,
                data: (data ?? Prisma.DbNull) as any,
            },
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}
