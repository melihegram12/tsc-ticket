import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/kb/[id] - Get single article
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { id } = await params;
        const articleId = parseInt(id);

        const article = await prisma.kBArticle.findUnique({
            where: { id: articleId },
            include: {
                category: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
                updatedBy: { select: { id: true, name: true } },
            },
        });

        if (!article) {
            return NextResponse.json({ error: 'Makale bulunamadı' }, { status: 404 });
        }

        // Only show unpublished articles to non-requesters
        if (!article.isPublished && session.user.role === 'Requester') {
            return NextResponse.json({ error: 'Makale bulunamadı' }, { status: 404 });
        }

        // Increment view count
        await prisma.kBArticle.update({
            where: { id: articleId },
            data: { viewCount: { increment: 1 } },
        });

        // Get related articles from same category
        const relatedArticles = await prisma.kBArticle.findMany({
            where: {
                categoryId: article.categoryId,
                id: { not: articleId },
                isPublished: true,
            },
            take: 5,
            select: {
                id: true,
                title: true,
            },
        });

        return NextResponse.json({ article, relatedArticles });
    } catch (error) {
        console.error('Error fetching article:', error);
        return NextResponse.json({ error: 'Makale alınamadı' }, { status: 500 });
    }
}

// PATCH /api/kb/[id] - Update article
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        if (session.user.role === 'Requester') {
            return NextResponse.json({ error: 'Makale düzenleme yetkiniz yok' }, { status: 403 });
        }

        const { id } = await params;
        const articleId = parseInt(id);
        const body = await request.json();
        const { title, body: articleBody, excerpt, categoryId, isPublished } = body;

        const updateData: any = {
            updatedById: parseInt(session.user.id),
        };

        if (title !== undefined) updateData.title = title;
        if (articleBody !== undefined) updateData.body = articleBody;
        if (excerpt !== undefined) updateData.excerpt = excerpt;
        if (categoryId !== undefined) updateData.categoryId = categoryId;
        if (isPublished !== undefined) updateData.isPublished = isPublished;

        const article = await prisma.kBArticle.update({
            where: { id: articleId },
            data: updateData,
            include: {
                category: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json(article);
    } catch (error) {
        console.error('Error updating article:', error);
        return NextResponse.json({ error: 'Makale güncellenemedi' }, { status: 500 });
    }
}

// POST /api/kb/[id]/feedback - Rate article helpfulness
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { id } = await params;
        const articleId = parseInt(id);
        const body = await request.json();
        const { helpful } = body;

        await prisma.kBArticle.update({
            where: { id: articleId },
            data: helpful
                ? { helpfulCount: { increment: 1 } }
                : { notHelpfulCount: { increment: 1 } },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        return NextResponse.json({ error: 'Geri bildirim gönderilemedi' }, { status: 500 });
    }
}
