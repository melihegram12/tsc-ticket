import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET /api/profile - Get current user profile
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
                locale: true,
                timezone: true,
                lastLoginAt: true,
                createdAt: true,
                role: { select: { id: true, name: true } },
                departments: {
                    include: {
                        department: { select: { id: true, name: true } },
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Profil alınamadı' }, { status: 500 });
    }
}

// PATCH /api/profile - Update profile
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const body = await request.json();
        const { name, locale, timezone, currentPassword, newPassword } = body;

        const updateData: Record<string, unknown> = {};

        if (name !== undefined) updateData.name = name;
        if (locale !== undefined) updateData.locale = locale;
        if (timezone !== undefined) updateData.timezone = timezone;

        // Handle password change
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json(
                    { error: 'Mevcut şifre gereklidir' },
                    { status: 400 }
                );
            }

            // Verify current password
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { passwordHash: true },
            });

            if (!user?.passwordHash) {
                return NextResponse.json(
                    { error: 'Şifre değiştirilemez' },
                    { status: 400 }
                );
            }

            const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isValid) {
                return NextResponse.json(
                    { error: 'Mevcut şifre yanlış' },
                    { status: 400 }
                );
            }

            updateData.passwordHash = await bcrypt.hash(newPassword, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                locale: true,
                timezone: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Profil güncellenemedi' }, { status: 500 });
    }
}
