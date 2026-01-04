import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { CONTACTS, type Contact } from '../../_data/contacts'

// Cache the contacts data for 10 minutes (600 seconds)
// This function will be re-executed every 10 minutes to refresh the data
// Cache the contacts data for 10 minutes (600 seconds)
// This function will be re-executed every 10 minutes to refresh the data
// The refreshed_at timestamp is included in the cache, so it only changes when cache refreshes
const getCachedContacts = unstable_cache(
  async () => {
    // In a real app, you might fetch from a database or external API here
    // For now, we're just returning the static CONTACTS array
    const refreshedAt = new Date().toISOString()
    
    // Add refreshed_at timestamp to each contact at cache refresh time
    // This timestamp will remain the same for all requests until cache is refreshed
    return CONTACTS.map((contact) => ({
      ...contact,
      refreshed_at: refreshedAt,
    }))
  },
  ['contacts'], // Cache key
  {
    revalidate: 60,  // Revalidate every 1 minute (60 seconds)
    tags: ['contacts'], // Optional: for on-demand revalidation
  }
)

export async function GET(_req: NextRequest) {
  // Get cached contacts (will be fresh for 10 minutes, then refreshed)
  // The refreshed_at timestamp is already included in the cached data
  const contactsWithTimestamp = await getCachedContacts()

  // Artificial delay so skeleton table is visible on the client.
  await new Promise((resolve) => setTimeout(resolve, 500))

  return NextResponse.json({
    ok: true,
    data: contactsWithTimestamp,
  })
}


