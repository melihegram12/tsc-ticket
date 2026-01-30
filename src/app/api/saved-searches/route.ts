import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/saved-searches - Get user's saved searches
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        const savedSearches = await prisma.savedSearch.findMany({
            where: { userId },
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' },
            ],
        });

        // Parse filters JSON for each search
        const searches = savedSearches.map(search => ({
            ...search,
            filters: JSON.parse(search.filters),
        }));

        return NextResponse.json(searches);
    } catch (error) {
        console.error('Error fetching saved searches:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/saved-searches - Create a new saved search
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const body = await request.json();
        const { name, filters, isDefault } = body;

        if (!name || !name.trim()) {
            return NextResponse.json(
                { error: 'Search name is required' },
                { status: 400 }
            );
        }

        if (!filters || typeof filters !== 'object') {
            return NextResponse.json(
                { error: 'Filters object is required' },
                { status: 400 }
            );
        }

        // If setting as default, unset other defaults first
        if (isDefault) {
            await prisma.savedSearch.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });
        }

        const savedSearch = await prisma.savedSearch.create({
            data: {
                name: name.trim(),
                filters: JSON.stringify(filters),
                isDefault: isDefault || false,
                userId,
            },
        });

        return NextResponse.json({
            ...savedSearch,
            filters: JSON.parse(savedSearch.filters),
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating saved search:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
