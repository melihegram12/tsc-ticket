import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/chat/sessions - List chat sessions
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const userId = parseInt(session.user.id);
        const isAgent = ['Agent', 'Supervisor', 'Admin'].includes(session.user.role);

        const where: Record<string, unknown> = {};

        // Agents/Admins can see all or filter by status
        if (isAgent) {
            if (status === 'waiting') {
                where.status = 'WAITING';
                where.agentId = null;
            } else if (status === 'active') {
                where.OR = [
                    { agentId: userId },
                    { status: 'WAITING' },
                ];
            } else if (status === 'mine') {
                where.agentId = userId;
            }
        } else {
            // Requesters only see their own chats
            where.customerId = userId;
        }

        if (status && status !== 'waiting' && status !== 'active' && status !== 'mine') {
            where.status = status.toUpperCase();
        }

        const sessions = await prisma.chatSession.findMany({
            where,
            include: {
                customer: {
                    select: { id: true, name: true, email: true, avatarUrl: true },
                },
                agent: {
                    select: { id: true, name: true, avatarUrl: true },
                },
                messages: {
                    orderBy: { sentAt: 'desc' },
                    take: 1,
                    include: {
                        sender: {
                            select: { id: true, name: true },
                        },
                    },
                },
                _count: {
                    select: {
                        messages: true,
                    },
                },
            },
            orderBy: { startedAt: 'desc' },
        });

        return NextResponse.json(sessions);
    } catch (error) {
        console.error('Error fetching chat sessions:', error);
        return NextResponse.json({ error: 'Chat oturumları alınamadı' }, { status: 500 });
    }
}

// POST /api/chat/sessions - Create new chat session
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { subject, initialMessage } = body;

        // Check if user already has an active session
        const existingSession = await prisma.chatSession.findFirst({
            where: {
                customerId: parseInt(session.user.id),
                status: { in: ['WAITING', 'ACTIVE'] },
            },
        });

        if (existingSession) {
            return NextResponse.json(existingSession, { status: 200 });
        }

        // Create new session
        const chatSession = await prisma.chatSession.create({
            data: {
                customerId: parseInt(session.user.id),
                subject: subject || 'Canlı Destek',
                status: 'WAITING',
                messages: initialMessage ? {
                    create: {
                        senderId: parseInt(session.user.id),
                        message: initialMessage,
                        isRead: false,
                    },
                } : undefined,
            },
            include: {
                customer: {
                    select: { id: true, name: true, email: true, avatarUrl: true },
                },
                messages: {
                    include: {
                        sender: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
        });

        return NextResponse.json(chatSession, { status: 201 });
    } catch (error) {
        console.error('Error creating chat session:', error);
        return NextResponse.json({ error: 'Chat oturumu oluşturulamadı' }, { status: 500 });
    }
}
