import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processEmailsToTickets, getIMAPConfigFromSettings } from '@/lib/imap';
import prisma from '@/lib/prisma';

// POST /api/email/fetch - Manually trigger email fetch
export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !['Admin', 'Supervisor'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const config = await getIMAPConfigFromSettings();
        if (!config) {
            return NextResponse.json({
                error: 'IMAP yapılandırması bulunamadı. Admin ayarlarından yapılandırın.',
            }, { status: 400 });
        }

        // Get default department for email tickets
        const defaultDeptSetting = await prisma.systemSetting.findUnique({
            where: { key: 'email.default_department_id' },
        });

        let departmentId = defaultDeptSetting ? parseInt(defaultDeptSetting.value) : null;

        if (!departmentId) {
            // Use first available department
            const firstDept = await prisma.department.findFirst();
            departmentId = firstDept?.id || null;
        }

        if (!departmentId) {
            return NextResponse.json({
                error: 'Varsayılan departman bulunamadı.',
            }, { status: 400 });
        }

        const created = await processEmailsToTickets(config, departmentId);

        return NextResponse.json({
            success: true,
            message: `${created} yeni ticket oluşturuldu`,
            ticketsCreated: created,
        });
    } catch (error: any) {
        console.error('Error fetching emails:', error);
        return NextResponse.json({
            error: error.message || 'E-posta alınırken hata oluştu',
        }, { status: 500 });
    }
}

// GET /api/email/fetch - Get IMAP status
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !['Admin', 'Supervisor'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const config = await getIMAPConfigFromSettings();

        return NextResponse.json({
            configured: !!config,
            host: config?.host || null,
            user: config?.user || null,
        });
    } catch (error) {
        console.error('Error getting IMAP status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
