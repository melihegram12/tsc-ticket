import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET /api/users
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const departmentId = searchParams.get('departmentId');
        const roleId = searchParams.get('roleId');
        const isActive = searchParams.get('isActive');

        const where: Record<string, unknown> = {};

        if (departmentId) {
            where.departments = {
                some: { departmentId: parseInt(departmentId) },
            };
        }

        if (roleId) {
            where.roleId = parseInt(roleId);
        }

        if (isActive !== null) {
            where.isActive = isActive === 'true';
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
                role: {
                    select: { id: true, name: true },
                },
                departments: {
                    select: {
                        isPrimary: true,
                        department: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Kullanıcılar alınamadı' }, { status: 500 });
    }
}

// POST /api/users
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        if (!session.user.permissions.includes('admin.users')) {
            return NextResponse.json({ error: 'Kullanıcı oluşturma yetkiniz yok' }, { status: 403 });
        }

        const body = await request.json();
        const { email, name, password, roleId, departmentIds } = body;

        if (!email?.trim() || !name?.trim() || !roleId) {
            return NextResponse.json(
                { error: 'E-posta, ad ve rol gereklidir' },
                { status: 400 }
            );
        }

        // Check if email exists
        const existing = await prisma.user.findUnique({
            where: { email: email.trim() },
        });

        if (existing) {
            return NextResponse.json({ error: 'Bu e-posta zaten kullanılıyor' }, { status: 400 });
        }

        const passwordHash = password ? await bcrypt.hash(password, 10) : null;

        const user = await prisma.user.create({
            data: {
                email: email.trim(),
                name: name.trim(),
                passwordHash,
                roleId,
                departments: departmentIds?.length
                    ? {
                        createMany: {
                            data: departmentIds.map((deptId: number, index: number) => ({
                                departmentId: deptId,
                                isPrimary: index === 0,
                            })),
                        },
                    }
                    : undefined,
            },
            include: {
                role: { select: { id: true, name: true } },
                departments: {
                    include: {
                        department: { select: { id: true, name: true } },
                    },
                },
            },
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Kullanıcı oluşturulamadı' }, { status: 500 });
    }
}
