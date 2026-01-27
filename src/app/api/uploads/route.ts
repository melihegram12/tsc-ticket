import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid'; // We might need to install uuid or use crypto
import crypto from 'crypto';

// POST /api/uploads
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { error: 'Dosya yüklenmedi' },
                { status: 400 }
            );
        }

        // Validate size (e.g. 10MB)
        const MAX_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: 'Dosya boyutu 10MB\'dan büyük olamaz' },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload directory structure: ./uploads/YYYY/MM/
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');

        // Use configured upload dir or default to ./uploads
        const uploadBaseDir = process.env.UPLOAD_DIR || './uploads';
        const relativeDir = join(year.toString(), month);
        const targetDir = join(uploadBaseDir, relativeDir);

        // Ensure directory exists
        await mkdir(targetDir, { recursive: true });

        // Generate unique filename
        const uniqueId = crypto.randomUUID();
        const originalName = file.name;
        const extension = originalName.split('.').pop();
        const safeName = `${uniqueId}.${extension}`;
        const finalPath = join(targetDir, safeName);

        // Save file
        await writeFile(finalPath, buffer);

        // Return metadata to be sent with Ticket/Message creation
        // We return the 'storagePath' relative to UPLOAD_DIR or absolute?
        // Let's return the relative path from UPLOAD_DIR, so we can construct it later.
        // Actually storing the full relative path used for retrieval is best.
        // If we serve via API, we might need just the ID + ext or the path.
        const storagePath = join(relativeDir, safeName).replace(/\\/g, '/'); // Normalize for DB

        return NextResponse.json({
            fileName: originalName,
            storagePath: storagePath,
            mimeType: file.type,
            sizeBytes: file.size,
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Dosya yüklenirken hata oluştu' },
            { status: 500 }
        );
    }
}
