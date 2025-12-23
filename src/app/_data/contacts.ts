export type Contact = {
  id: number
  firstName: string
  lastName: string
  email: string
  country: string
  status: 'active' | 'inactive' | 'prospect'
  createdAt: string // ISO date (YYYY-MM-DD)
}

export const CONTACTS: Contact[] = [
  {
    id: 1,
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice.johnson@example.com',
    country: 'US',
    status: 'active',
    createdAt: '2024-10-01',
  },
  {
    id: 2,
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'bob.smith@example.com',
    country: 'UK',
    status: 'prospect',
    createdAt: '2024-09-15',
  },
  {
    id: 3,
    firstName: 'Carol',
    lastName: 'Lee',
    email: 'carol.lee@example.com',
    country: 'HK',
    status: 'inactive',
    createdAt: '2024-08-20',
  },
  {
    id: 4,
    firstName: 'David',
    lastName: 'Ng',
    email: 'david.ng@example.com',
    country: 'HK',
    status: 'active',
    createdAt: '2024-07-05',
  },
  {
    id: 5,
    firstName: 'Emily',
    lastName: 'Brown',
    email: 'emily.brown@example.com',
    country: 'AU',
    status: 'prospect',
    createdAt: '2024-06-18',
  },
  {
    id: 6,
    firstName: 'Frank',
    lastName: 'Wilson',
    email: 'frank.wilson@example.com',
    country: 'US',
    status: 'inactive',
    createdAt: '2024-05-10',
  },
  {
    id: 7,
    firstName: 'Grace',
    lastName: 'Chan',
    email: 'grace.chan@example.com',
    country: 'HK',
    status: 'active',
    createdAt: '2024-04-01',
  },
  {
    id: 8,
    firstName: 'Henry',
    lastName: 'Taylor',
    email: 'henry.taylor@example.com',
    country: 'UK',
    status: 'prospect',
    createdAt: '2024-03-22',
  },
]


