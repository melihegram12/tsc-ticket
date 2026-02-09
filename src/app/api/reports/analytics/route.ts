import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        // Only admins and supervisors can view full reports
        // Agents can see limited data (future improvement)
        if (!['Admin', 'Supervisor'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Rapor görüntüleme yetkiniz yok' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '7'; // Default 7 days
        const days = parseInt(range);

        const startDate = subDays(new Date(), days);

        // 1. Summary Stats
        const [totalTickets, openTickets, resolvedTickets, slaBreaches] = await Promise.all([
            prisma.ticket.count(),
            prisma.ticket.count({ where: { status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
            prisma.ticket.count({ where: { status: 'RESOLVED' } }),
            prisma.sLATracking.count({
                where: {
                    OR: [
                        { firstResponseBreachedAt: { not: null } },
                        { resolutionBreachedAt: { not: null } }
                    ]
                }
            })
        ]);

        // 2. Ticket Volume Trend (Last N days)
        const trendData = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const start = startOfDay(date);
            const end = endOfDay(date);

            const created = await prisma.ticket.count({
                where: { createdAt: { gte: start, lte: end } }
            });
            const resolved = await prisma.ticket.count({
                where: { resolvedAt: { gte: start, lte: end } }
            });

            trendData.push({
                date: format(date, 'd MMM', { locale: tr }),
                created,
                resolved,
            });
        }

        // 3. Department Distribution
        const departments = await prisma.department.findMany({
            include: {
                _count: {
                    select: { tickets: true }
                }
            }
        });

        const departmentData = departments.map(dept => ({
            name: dept.name,
            value: dept._count.tickets
        })).filter(d => d.value > 0);

        // 4. Priority Distribution
        const priorities = await prisma.ticket.groupBy({
            by: ['priority'],
            _count: {
                priority: true
            }
        });

        const priorityData = priorities.map(p => ({
            name: p.priority,
            value: p._count.priority
        }));

        // 5. Status Distribution
        const statuses = await prisma.ticket.groupBy({
            by: ['status'],
            _count: {
                status: true
            }
        });

        const statusData = statuses.map(s => ({
            name: s.status,
            value: s._count.status
        }));

        return NextResponse.json({
            summary: {
                total: totalTickets,
                open: openTickets,
                resolved: resolvedTickets,
                slaBreaches
            },
            trend: trendData,
            distribution: {
                department: departmentData,
                priority: priorityData,
                status: statusData
            }
        });

    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({ error: 'Rapor verileri alınamadı' }, { status: 500 });
    }
}
