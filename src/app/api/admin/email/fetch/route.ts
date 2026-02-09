import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { processEmailsToTickets, getIMAPConfigFromSettings } from '@/lib/imap';

// POST - Manually fetch emails and create tickets
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'Admin') {
        return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }

    try {
        // Get IMAP config
        const config = await getIMAPConfigFromSettings();

        if (!config) {
            return NextResponse.json(
                { error: 'IMAP ayarları yapılandırılmamış' },
                { status: 400 }
            );
        }

        // Get target department
        const deptSetting = await prisma.systemSetting.findUnique({
            where: { key: 'email.target_department' },
        });

        if (!deptSetting?.value) {
            return NextResponse.json(
                { error: 'Hedef departman seçilmemiş' },
                { status: 400 }
            );
        }

        const departmentId = parseInt(deptSetting.value);

        // Verify department exists
        const department = await prisma.department.findUnique({
            where: { id: departmentId },
        });

        if (!department) {
            return NextResponse.json(
                { error: 'Hedef departman bulunamadı' },
                { status: 400 }
            );
        }

        // Fetch and process emails
        const createdCount = await processEmailsToTickets(config, departmentId);

        // Update last sync time
        await prisma.systemSetting.upsert({
            where: { key: 'email.last_sync' },
            update: { value: new Date().toISOString() },
            create: {
                key: 'email.last_sync',
                value: new Date().toISOString(),
                type: 'string',
                description: 'Last email sync timestamp',
            },
        });

        return NextResponse.json({
            success: true,
            message: `${createdCount} yeni ticket oluşturuldu`,
            createdCount,
        });
    } catch (error) {
        console.error('Error fetching emails:', error);
        const message = error instanceof Error ? error.message : 'E-posta çekme hatası';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
