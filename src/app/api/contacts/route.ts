import { NextRequest, NextResponse } from 'next/server'
import { CONTACTS } from '@/app/_data/contacts'

export async function GET(_req: NextRequest) {
  // Artificial delay so skeleton table is visible on the client.
  await new Promise((resolve) => setTimeout(resolve, 3000))

  return NextResponse.json({
    ok: true,
    data: CONTACTS,
  })
}


