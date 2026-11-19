import { randomUUID } from 'node:crypto'
import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const links = pgTable(
  'links',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    originalUrl: text('original_url').notNull(),
    shortCode: text('short_code').notNull().unique(),
    accessCount: integer('access_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => [index('links_created_at_idx').on(table.createdAt.desc())]
)
