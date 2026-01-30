import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/reports - Get report data
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        // Only allow agents, supervisors, and admins to view reports
        if (session.user.role === 'Requester') {
            return NextResponse.json({ error: 'Rapor görme yetkiniz yok' }, { status: 403 });
        }

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get department filter for non-admins
        const userDepts = session.user.departments?.map(d => d.id) || [];
        const deptFilter = session.user.role === 'Admin'
            ? {}
            : { departmentId: { in: userDepts } };

        // Basic stats
        const [
            totalTickets,
            openTickets,
            resolvedToday,
            closedThisMonth,
            avgResolutionTime,
        ] = await Promise.all([
            prisma.ticket.count({ where: deptFilter }),
            prisma.ticket.count({
                where: {
                    ...deptFilter,
                    status: { in: ['NEW', 'OPEN', 'WAITING_REQUESTER', 'PENDING', 'REOPENED'] }
                }
            }),
            prisma.ticket.count({
                where: {
                    ...deptFilter,
                    resolvedAt: { gte: startOfToday }
                }
            }),
            prisma.ticket.count({
                where: {
                    ...deptFilter,
                    closedAt: { gte: startOfMonth }
                }
            }),
            prisma.ticket.aggregate({
                where: {
                    ...deptFilter,
                    resolvedAt: { not: null },
                    createdAt: { gte: startOfMonth },
                },
                _avg: {
                    id: true, // Placeholder - will calculate manually
                },
            }),
        ]);

        // Status distribution
        const statusCounts = await prisma.ticket.groupBy({
            by: ['status'],
            where: deptFilter,
            _count: { id: true },
        });

        // Priority distribution
        const priorityCounts = await prisma.ticket.groupBy({
            by: ['priority'],
            where: deptFilter,
            _count: { id: true },
        });

        // Department distribution
        const departmentCounts = await prisma.ticket.groupBy({
            by: ['departmentId'],
            where: deptFilter,
            _count: { id: true },
        });

        const departments = await prisma.department.findMany({
            select: { id: true, name: true },
        });

        const departmentStats = departmentCounts.map(d => ({
            name: departments.find(dept => dept.id === d.departmentId)?.name || 'Bilinmiyor',
            count: d._count.id,
        }));

        // Last 7 days trend
        const dailyTrend: { date: string; created: number; resolved: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(startOfToday);
            date.setDate(date.getDate() - i);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const [created, resolved] = await Promise.all([
                prisma.ticket.count({
                    where: {
                        ...deptFilter,
                        createdAt: { gte: date, lt: nextDate },
                    },
                }),
                prisma.ticket.count({
                    where: {
                        ...deptFilter,
                        resolvedAt: { gte: date, lt: nextDate },
                    },
                }),
            ]);

            dailyTrend.push({
                date: date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' }),
                created,
                resolved,
            });
        }

        // SLA stats
        const slaBreached = await prisma.sLATracking.count({
            where: {
                OR: [
                    { firstResponseBreachedAt: { not: null } },
                    { resolutionBreachedAt: { not: null } },
                ],
            },
        });

        const slaOnTrack = await prisma.sLATracking.count({
            where: {
                firstResponseBreachedAt: null,
                resolutionBreachedAt: null,
            },
        });

        // Top agents this month
        const topAgents = await prisma.ticket.groupBy({
            by: ['assignedToId'],
            where: {
                ...deptFilter,
                assignedToId: { not: null },
                resolvedAt: { gte: startOfMonth },
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5,
        });

        const agentUsers = await prisma.user.findMany({
            where: { id: { in: topAgents.map(a => a.assignedToId!).filter(Boolean) } },
            select: { id: true, name: true },
        });

        const topAgentStats = topAgents.map(a => ({
            name: agentUsers.find(u => u.id === a.assignedToId)?.name || 'Atanmamış',
            resolved: a._count.id,
        }));

        // Satisfaction statistics
        const satisfactionStats = await prisma.ticket.aggregate({
            where: {
                ...deptFilter,
                satisfactionScore: { not: null },
            },
            _avg: { satisfactionScore: true },
            _count: { satisfactionScore: true },
        });

        const satisfactionDistribution = await prisma.ticket.groupBy({
            by: ['satisfactionScore'],
            where: {
                ...deptFilter,
                satisfactionScore: { not: null },
            },
            _count: { id: true },
        });

        return NextResponse.json({
            overview: {
                totalTickets,
                openTickets,
                resolvedToday,
                closedThisMonth,
            },
            statusDistribution: statusCounts.map(s => ({
                status: s.status,
                count: s._count.id,
            })),
            priorityDistribution: priorityCounts.map(p => ({
                priority: p.priority,
                count: p._count.id,
            })),
            departmentStats,
            dailyTrend,
            sla: {
                onTrack: slaOnTrack,
                breached: slaBreached,
                compliance: slaOnTrack + slaBreached > 0
                    ? Math.round((slaOnTrack / (slaOnTrack + slaBreached)) * 100)
                    : 100,
            },
            topAgents: topAgentStats,
            satisfaction: {
                averageScore: satisfactionStats._avg.satisfactionScore
                    ? Math.round(satisfactionStats._avg.satisfactionScore * 10) / 10
                    : null,
                totalRatings: satisfactionStats._count.satisfactionScore,
                distribution: satisfactionDistribution.map(s => ({
                    score: s.satisfactionScore,
                    count: s._count.id,
                })),
            },
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        return NextResponse.json({ error: 'Raporlar alınamadı' }, { status: 500 });
    }
}
