import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    // The bible_versions table uses id as the version code
    const versions = db.prepare('SELECT id as code, name, language, copyright FROM bible_versions ORDER BY language, name').all();
    return NextResponse.json({ versions });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch Bible versions' }, { status: 500 });
  }
}
