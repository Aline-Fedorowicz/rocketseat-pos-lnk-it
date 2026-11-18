import { Pool } from 'pg'

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    'postgres://docker:docker@localhost:5432/lnk_it',
})
