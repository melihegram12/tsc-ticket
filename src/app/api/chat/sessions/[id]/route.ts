import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/chat/sessions/[id] - Get chat session details
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

        const chatSession = await prisma.chatSession.findUnique({
            where: { id: sessionId },
            include: {
                customer: {
                    select: { id: true, name: true, email: true, avatarUrl: true },
                },
                agent: {
                    select: { id: true, name: true, avatarUrl: true },
                },
                messages: {
                    orderBy: { sentAt: 'asc' },
                    include: {
                        sender: {
                            select: { id: true, name: true, avatarUrl: true },
                        },
                    },
                },
            },
        });

        if (!chatSession) {
            return NextResponse.json({ error: 'Chat oturumu bulunamadı' }, { status: 404 });
        }

        // Check access
        if (!isAgent && chatSession.customerId !== userId) {
            return NextResponse.json({ error: 'Bu chate erişim yetkiniz yok' }, { status: 403 });
        }

        return NextResponse.json(chatSession);
    } catch (error) {
        console.error('Error fetching chat session:', error);
        return NextResponse.json({ error: 'Chat oturumu alınamadı' }, { status: 500 });
    }
}

// PATCH /api/chat/sessions/[id] - Update chat session (accept, close, etc.)
export async function PATCH(
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

        const chatSession = await prisma.chatSession.findUnique({
            where: { id: sessionId },
        });

        if (!chatSession) {
            return NextResponse.json({ error: 'Chat oturumu bulunamadı' }, { status: 404 });
        }

        const updateData: Record<string, unknown> = {};

        // Agent accepting chat
        if (body.action === 'accept' && isAgent) {
            if (chatSession.agentId && chatSession.agentId !== userId) {
                return NextResponse.json({ error: 'Bu chat başka bir agent tarafından alındı' }, { status: 400 });
            }
            updateData.agentId = userId;
            updateData.status = 'ACTIVE';
        }

        // Closing chat
        if (body.action === 'close') {
            if (!isAgent && chatSession.customerId !== userId) {
                return NextResponse.json({ error: 'Bu chati kapatma yetkiniz yok' }, { status: 403 });
            }
            updateData.status = 'CLOSED';
            updateData.endedAt = new Date();
        }

        // Transfer to another agent
        if (body.action === 'transfer' && isAgent && body.agentId) {
            updateData.agentId = body.agentId;
        }

        const updated = await prisma.chatSession.update({
            where: { id: sessionId },
            data: updateData,
            include: {
                customer: {
                    select: { id: true, name: true, email: true },
                },
                agent: {
                    select: { id: true, name: true },
                },
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating chat session:', error);
        return NextResponse.json({ error: 'Chat oturumu güncellenemedi' }, { status: 500 });
    }
}
