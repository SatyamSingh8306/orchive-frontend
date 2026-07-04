import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE = process.env.FASTAPI_BASE_URL || 'http://localhost:8000/api';

export async function GET() {
  try {
    const res = await fetch(`${FASTAPI_BASE}/agents`);
    if (!res.ok) throw new Error('Failed to fetch agents');
    const agents = await res.json();
    return NextResponse.json(agents);
  } catch (err) {
    console.error('Agents proxy error:', err);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 502 });
  }
}
