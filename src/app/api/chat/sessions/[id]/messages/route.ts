import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/chat/sessions/[id]/messages - Get messages for a chat session
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { id } = await params;
        const sessionId = parseInt(id);
        const userId = parseInt(session.user.id);
        const isAgent = ['Agent', 'Supervisor', 'Admin'].includes(session.user.role);

        // Check access
        const chatSession = await prisma.chatSession.findUnique({
            where: { id: sessionId },
            select: { customerId: true, agentId: true },
        });

        if (!chatSession) {
            return NextResponse.json({ error: 'Chat oturumu bulunamadı' }, { status: 404 });
        }

        if (!isAgent && chatSession.customerId !== userId) {
            return NextResponse.json({ error: 'Bu chate erişim yetkiniz yok' }, { status: 403 });
        }

        const messages = await prisma.chatMessage.findMany({
            where: { sessionId },
            orderBy: { sentAt: 'asc' },
            include: {
                sender: {
                    select: { id: true, name: true, avatarUrl: true },
                },
            },
        });

        // Mark messages as read
        await prisma.chatMessage.updateMany({
            where: {
                sessionId,
                senderId: { not: userId },
                isRead: false,
            },
            data: { isRead: true },
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Mesajlar alınamadı' }, { status: 500 });
    }
}

// POST /api/chat/sessions/[id]/messages - Send a message
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { id } = await params;
        const sessionId = parseInt(id);
        const userId = parseInt(session.user.id);
        const isAgent = ['Agent', 'Supervisor', 'Admin'].includes(session.user.role);
        const body = await request.json();

        // Check access
        const chatSession = await prisma.chatSession.findUnique({
            where: { id: sessionId },
            select: { customerId: true, agentId: true, status: true },
        });

        if (!chatSession) {
            return NextResponse.json({ error: 'Chat oturumu bulunamadı' }, { status: 404 });
        }

        if (!isAgent && chatSession.customerId !== userId) {
            return NextResponse.json({ error: 'Bu chate mesaj gönderme yetkiniz yok' }, { status: 403 });
        }

        if (chatSession.status === 'CLOSED') {
            return NextResponse.json({ error: 'Bu chat kapatılmış' }, { status: 400 });
        }

        const message = await prisma.chatMessage.create({
            data: {
                sessionId,
                senderId: userId,
                message: body.message,
                isRead: false,
            },
            include: {
                sender: {
                    select: { id: true, name: true, avatarUrl: true },
                },
            },
        });

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Mesaj gönderilemedi' }, { status: 500 });
    }
}
