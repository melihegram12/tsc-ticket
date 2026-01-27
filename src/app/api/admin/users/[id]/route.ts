import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/admin/users/[id] - Get single user
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { id } = await params;
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            include: {
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
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Kullanıcı alınamadı' }, { status: 500 });
    }
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { id } = await params;
        const userId = parseInt(id);
        const body = await request.json();
        const { email, name, password, roleId, departmentIds, isActive } = body;

        // Check if new email already exists for another user
        if (email) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    email,
                    NOT: { id: userId },
                },
            });

            if (existingUser) {
                return NextResponse.json(
                    { error: 'Bu e-posta adresi zaten kullanımda' },
                    { status: 400 }
                );
            }
        }

        // Prepare update data
        const updateData: any = {};
        if (email !== undefined) updateData.email = email;
        if (name !== undefined) updateData.name = name;
        if (roleId !== undefined) updateData.roleId = roleId;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (password) updateData.passwordHash = await bcrypt.hash(password, 10);

        // Update user
        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: {
                role: { select: { id: true, name: true } },
                departments: {
                    include: {
                        department: { select: { id: true, name: true } },
                    },
                },
            },
        });

        // Update departments if provided
        if (departmentIds !== undefined) {
            // Remove existing department assignments
            await prisma.userDepartment.deleteMany({
                where: { userId },
            });

            // Add new department assignments
            if (departmentIds.length > 0) {
                await prisma.userDepartment.createMany({
                    data: departmentIds.map((deptId: number, index: number) => ({
                        userId,
                        departmentId: deptId,
                        isPrimary: index === 0,
                    })),
                });
            }

            // Refetch user with updated departments
            const updatedUser = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    role: { select: { id: true, name: true } },
                    departments: {
                        include: {
                            department: { select: { id: true, name: true } },
                        },
                    },
                },
            });

            return NextResponse.json(updatedUser);
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Kullanıcı güncellenemedi' }, { status: 500 });
    }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { id } = await params;
        const userId = parseInt(id);

        // Prevent self-deletion
        if (userId === parseInt(session.user.id)) {
            return NextResponse.json(
                { error: 'Kendinizi silemezsiniz' },
                { status: 400 }
            );
        }

        await prisma.user.delete({
            where: { id: userId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Kullanıcı silinemedi' }, { status: 500 });
    }
}
