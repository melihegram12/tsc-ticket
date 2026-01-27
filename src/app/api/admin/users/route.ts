import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const roleId = searchParams.get('roleId');
        const isActive = searchParams.get('isActive');

        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
            ];
        }
        if (roleId) where.roleId = parseInt(roleId);
        if (isActive !== null && isActive !== '') {
            where.isActive = isActive === 'true';
        }

        const users = await prisma.user.findMany({
            where,
            include: {
                role: { select: { id: true, name: true } },
                departments: {
                    include: {
                        department: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        const roles = await prisma.role.findMany({
            orderBy: { name: 'asc' },
        });

        const departments = await prisma.department.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json({ users, roles, departments });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Kullanıcılar alınamadı' }, { status: 500 });
    }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const body = await request.json();
        const { email, name, password, roleId, departmentIds, isActive = true } = body;

        if (!email || !name || !roleId) {
            return NextResponse.json(
                { error: 'E-posta, ad ve rol zorunludur' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Bu e-posta adresi zaten kullanımda' },
                { status: 400 }
            );
        }

        // Hash password if provided
        const passwordHash = password ? await bcrypt.hash(password, 10) : null;

        const user = await prisma.user.create({
            data: {
                email,
                name,
                passwordHash,
                roleId,
                isActive,
                departments: departmentIds?.length
                    ? {
                        create: departmentIds.map((deptId: number, index: number) => ({
                            departmentId: deptId,
                            isPrimary: index === 0,
                        })),
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
