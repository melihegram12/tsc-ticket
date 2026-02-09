import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch IMAP settings
export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'Admin') {
        return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }

    try {
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: { startsWith: 'email.imap.' },
            },
        });

        const config: Record<string, string> = {};
        settings.forEach((s) => {
            const key = s.key.replace('email.imap.', '');
            config[key] = s.value;
        });

        // Get target department
        const deptSetting = await prisma.systemSetting.findUnique({
            where: { key: 'email.target_department' },
        });

        return NextResponse.json({
            host: config.host || '',
            port: config.port || '993',
            user: config.user || '',
            password: config.password ? '********' : '',
            tls: config.tls !== 'false',
            targetDepartmentId: deptSetting?.value || '',
        });
    } catch (error) {
        console.error('Error fetching email config:', error);
        return NextResponse.json({ error: 'Ayarlar alınamadı' }, { status: 500 });
    }
}

// POST - Save IMAP settings
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'Admin') {
        return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { host, port, user, password, tls, targetDepartmentId } = body;

        const settings = [
            { key: 'email.imap.host', value: host || '' },
            { key: 'email.imap.port', value: String(port || 993) },
            { key: 'email.imap.user', value: user || '' },
            { key: 'email.imap.tls', value: String(tls !== false) },
            { key: 'email.target_department', value: String(targetDepartmentId || '') },
        ];

        // Only update password if provided (not masked)
        if (password && password !== '********') {
            settings.push({ key: 'email.imap.password', value: password });
        }

        for (const setting of settings) {
            await prisma.systemSetting.upsert({
                where: { key: setting.key },
                update: { value: setting.value },
                create: {
                    key: setting.key,
                    value: setting.value,
                    type: 'string',
                    description: `Email IMAP setting: ${setting.key}`,
                },
            });
        }

        return NextResponse.json({ success: true, message: 'Ayarlar kaydedildi' });
    } catch (error) {
        console.error('Error saving email config:', error);
        return NextResponse.json({ error: 'Ayarlar kaydedilemedi' }, { status: 500 });
    }
}
