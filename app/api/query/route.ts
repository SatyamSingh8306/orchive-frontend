import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE = process.env.FASTAPI_BASE_URL || 'http://localhost:8000/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${FASTAPI_BASE}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Failed to query');
    const result = await res.json();
    return NextResponse.json(result);
  } catch (err) {
    console.error('Query proxy error:', err);
    return NextResponse.json({ error: 'Failed to query' }, { status: 502 });
  }
}
