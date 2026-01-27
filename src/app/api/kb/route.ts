import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/kb - Get KB categories and articles
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const categoryId = searchParams.get('categoryId');

        // Get categories
        const categories = await prisma.kBCategory.findMany({
            where: { isActive: true },
            include: {
                _count: {
                    select: { articles: { where: { isPublished: true } } },
                },
            },
            orderBy: { sortOrder: 'asc' },
        });

        // Build article filter
        const articleWhere: any = {
            isPublished: true,
        };

        if (search) {
            articleWhere.OR = [
                { title: { contains: search } },
                { body: { contains: search } },
            ];
        }

        if (categoryId) {
            articleWhere.categoryId = parseInt(categoryId);
        }

        // Get articles
        const articles = await prisma.kBArticle.findMany({
            where: articleWhere,
            include: {
                category: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
            },
            orderBy: { viewCount: 'desc' },
            take: 20,
        });

        // Get popular articles
        const popularArticles = await prisma.kBArticle.findMany({
            where: { isPublished: true },
            orderBy: { viewCount: 'desc' },
            take: 5,
            select: {
                id: true,
                title: true,
                viewCount: true,
                category: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({ categories, articles, popularArticles });
    } catch (error) {
        console.error('Error fetching KB:', error);
        return NextResponse.json({ error: 'Bilgi bankası alınamadı' }, { status: 500 });
    }
}

// POST /api/kb - Create KB article (admin/agent only)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        if (session.user.role === 'Requester') {
            return NextResponse.json({ error: 'Makale oluşturma yetkiniz yok' }, { status: 403 });
        }

        const body = await request.json();
        const { title, body: articleBody, excerpt, categoryId, isPublished = false } = body;

        if (!title || !articleBody || !categoryId) {
            return NextResponse.json(
                { error: 'Başlık, içerik ve kategori zorunludur' },
                { status: 400 }
            );
        }

        const userId = parseInt(session.user.id);

        const article = await prisma.kBArticle.create({
            data: {
                title,
                body: articleBody,
                excerpt,
                categoryId,
                isPublished,
                createdById: userId,
                updatedById: userId,
            },
            include: {
                category: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json(article, { status: 201 });
    } catch (error) {
        console.error('Error creating article:', error);
        return NextResponse.json({ error: 'Makale oluşturulamadı' }, { status: 500 });
    }
}
