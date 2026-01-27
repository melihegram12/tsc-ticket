import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/sla/stats
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        // Only for agents+
        if (session.user.role === 'Requester') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        // 1. SLA Breaches (Total and by type)
        const breachedStats = await prisma.sLATracking.aggregate({
            _count: {
                firstResponseBreachedAt: true,
                resolutionBreachedAt: true,
            },
        });

        // 2. Active SLA Risks (Tickets that are OPEN and due date is approaching or passed)
        // We consider "At Risk" if due in < 4 hours or already overdue but not resolved
        const now = new Date();
        const warningTime = new Date(now.getTime() + 4 * 60 * 60 * 1000); // +4 hours

        const atRiskCount = await prisma.sLATracking.count({
            where: {
                ticket: {
                    status: { notIn: ['RESOLVED', 'CLOSED'] }
                },
                OR: [
                    {
                        AND: [
                            { firstResponseBreachedAt: null },
                            { firstResponseDueAt: { lte: warningTime } }
                        ]
                    },
                    {
                        AND: [
                            { resolutionBreachedAt: null },
                            { resolutionDueAt: { lte: warningTime } }
                        ]
                    }
                ]
            }
        });

        // 3. Average Response Time (for resolved tickets in last 30 days)
        // This is complex in Prisma, usually needs raw query or fetching all data.
        // For simple MVP we might skip accurate avg calculation or do simplified version.

        return NextResponse.json({
            breaches: {
                response: breachedStats._count.firstResponseBreachedAt,
                resolution: breachedStats._count.resolutionBreachedAt,
                total: breachedStats._count.firstResponseBreachedAt + breachedStats._count.resolutionBreachedAt
            },
            atRisk: atRiskCount
        });

    } catch (error) {
        console.error('Error fetching SLA stats:', error);
        return NextResponse.json({ error: 'SLA istatistikleri alınamadı' }, { status: 500 });
    }
}
