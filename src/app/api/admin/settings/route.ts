import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/settings - Get all settings
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const settings = await prisma.systemSetting.findMany({
            orderBy: { key: 'asc' },
        });

        const slaPolicies = await prisma.sLAPolicy.findMany({
            include: {
                department: { select: { id: true, name: true } },
            },
            orderBy: [{ departmentId: 'asc' }, { priority: 'asc' }],
        });

        const departments = await prisma.department.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json({ settings, slaPolicies, departments });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Ayarlar alınamadı' }, { status: 500 });
    }
}

// PATCH /api/admin/settings - Update settings
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const body = await request.json();
        const { settings } = body;

        if (!Array.isArray(settings)) {
            return NextResponse.json({ error: 'Geçersiz veri formatı' }, { status: 400 });
        }

        for (const setting of settings) {
            await prisma.systemSetting.upsert({
                where: { key: setting.key },
                update: { value: setting.value },
                create: {
                    key: setting.key,
                    value: setting.value,
                    type: setting.type || 'string',
                    description: setting.description,
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Ayarlar güncellenemedi' }, { status: 500 });
    }
}
