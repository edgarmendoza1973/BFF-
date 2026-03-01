/**
 * /api/upload — Universal file upload endpoint
 * Accepts base64-encoded files (images, audio, video).
 * In production wire UPLOADTHING_SECRET or CLOUDINARY_* env vars.
 * Without cloud keys, files are stored as data-URIs in the DB — fine for
 * demo/dev; swap cloud branch for production.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export const runtime = 'nodejs';

// ─── limits ────────────────────────────────────────────────────────────────
const LIMITS: Record<string, number> = {
  image: 5  * 1024 * 1024,   // 5 MB
  audio: 50 * 1024 * 1024,   // 50 MB
  video: 200 * 1024 * 1024,  // 200 MB
};
const ALLOWED: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
};

// ─── helpers ────────────────────────────────────────────────────────────────
function mimeToCategory(mime: string): string {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  return 'unknown';
}

function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
    'image/gif': 'gif', 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3',
    'audio/wav': 'wav', 'audio/ogg': 'ogg', 'audio/aac': 'aac',
    'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
  };
  return map[mime] || 'bin';
}

export async function POST(req: NextRequest) {
  try {
    // ── auth ──────────────────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id as string;

    // ── parse body ────────────────────────────────────────────────────────
    const body = await req.json();
    const { data: base64Data, mimeType, purpose = 'avatar' } = body as {
      data: string;        // base64-encoded file bytes
      mimeType: string;
      purpose?: 'avatar' | 'event' | 'group' | 'sermon_audio' | 'sermon_video';
    };

    if (!base64Data || !mimeType) {
      return NextResponse.json({ error: 'Missing data or mimeType' }, { status: 400 });
    }

    // ── validate type + size ──────────────────────────────────────────────
    const category = mimeToCategory(mimeType);
    if (category === 'unknown') {
      return NextResponse.json({ error: `Unsupported file type: ${mimeType}` }, { status: 400 });
    }
    const allowedMimes = ALLOWED[category];
    if (!allowedMimes.includes(mimeType)) {
      return NextResponse.json({ error: `Not allowed: ${mimeType}` }, { status: 400 });
    }

    // Strip data-URI prefix if the client sent a full data URL
    const rawBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(rawBase64, 'base64');

    const maxBytes = LIMITS[category];
    if (buffer.byteLength > maxBytes) {
      return NextResponse.json(
        { error: `File too large (max ${maxBytes / 1024 / 1024} MB)` },
        { status: 413 }
      );
    }

    // ── try Cloudinary (production) ───────────────────────────────────────
    const cloudName  = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey     = process.env.CLOUDINARY_API_KEY;
    const apiSecret  = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      const folder = `bffplus/${purpose}`;
      const dataUri = `data:${mimeType};base64,${rawBase64}`;

      const formData = new FormData();
      formData.append('file', dataUri);
      formData.append('folder', folder);
      formData.append('api_key', apiKey);

      const timestamp = Math.floor(Date.now() / 1000);
      formData.append('timestamp', String(timestamp));

      // Simple signature (SHA-1 via node crypto)
      const crypto = await import('crypto');
      const sigStr = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash('sha1').update(sigStr).digest('hex');
      formData.append('signature', signature);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        { method: 'POST', body: formData }
      );
      if (res.ok) {
        const cloud = await res.json() as any;
        const url: string = cloud.secure_url;
        if (purpose === 'avatar') await saveAvatarUrl(userId, url);
        return NextResponse.json({ success: true, url, provider: 'cloudinary' });
      }
      console.warn('[upload] Cloudinary failed, falling back to local');
    }

    // ── local filesystem fallback (dev/sandbox) ───────────────────────────
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', purpose);
    if (!existsSync(uploadsDir)) await mkdir(uploadsDir, { recursive: true });

    const filename = `${userId}-${Date.now()}.${mimeToExt(mimeType)}`;
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);
    const url = `/uploads/${purpose}/${filename}`;

    if (purpose === 'avatar') await saveAvatarUrl(userId, url);

    return NextResponse.json({ success: true, url, provider: 'local' });
  } catch (err: any) {
    console.error('[upload]', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}

async function saveAvatarUrl(userId: string, url: string) {
  const db = getDb();
  db.prepare('UPDATE user_profiles SET avatar_url = ? WHERE user_id = ?').run(url, userId);
}
