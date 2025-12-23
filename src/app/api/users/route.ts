import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    return NextResponse.json(
      {
        ok: true,
        receivedAt: new Date().toISOString(),
        data: body,
      },
      { status: 200 },
    )
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: 'Invalid JSON payload',
      },
      { status: 400 },
    )
  }
}


