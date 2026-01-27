import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/canned-responses
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const departmentId = searchParams.get('departmentId');
        const search = searchParams.get('search');

        const where: any = {
            isActive: true,
        };

        if (departmentId) {
            // Include departmental AND global responses (departmentId is null)
            where.OR = [
                { departmentId: parseInt(departmentId) },
                { departmentId: null }
            ];
        } else {
            // If no department specified, maybe just list all accessible?
            // For now let's return global ones if no department specified
            where.departmentId = null;
        }

        if (search) {
            const searchFilter = {
                OR: [
                    { title: { contains: search } },
                    { body: { contains: search } },
                    { shortcut: { contains: search } },
                ]
            };

            if (where.OR) {
                where.AND = [
                    { OR: where.OR },
                    searchFilter
                ];
                delete where.OR; // Move existing OR to AND
            } else {
                where.OR = searchFilter.OR;
            }
        }

        const responses = await prisma.cannedResponse.findMany({
            where,
            orderBy: { title: 'asc' },
        });

        return NextResponse.json(responses);
    } catch (error) {
        console.error('Error fetching canned responses:', error);
        return NextResponse.json({ error: 'Hazır cevaplar alınamadı' }, { status: 500 });
    }
}

// POST /api/canned-responses
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        if (session.user.role === 'Requester') {
            return NextResponse.json({ error: 'Yetkisiz işlem' }, { status: 403 });
        }

        const body = await request.json();
        const { title, body: content, shortcut, departmentId } = body;

        if (!title || !content) {
            return NextResponse.json(
                { error: 'Başlık ve içerik zorunludur' },
                { status: 400 }
            );
        }

        const cannedResponse = await prisma.cannedResponse.create({
            data: {
                title,
                body: content,
                shortcut,
                departmentId: departmentId ? parseInt(departmentId) : null,
                createdById: parseInt(session.user.id),
            },
        });

        return NextResponse.json(cannedResponse, { status: 201 });
    } catch (error) {
        console.error('Error creating canned response:', error);
        return NextResponse.json({ error: 'Hazır cevap oluşturulamadı' }, { status: 500 });
    }
}
