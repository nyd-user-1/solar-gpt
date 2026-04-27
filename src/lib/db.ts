import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

let _sql: NeonQueryFunction<false, false> | null = null

function getDriver(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is not set')
    _sql = neon(url)
  }
  return _sql
}

function lazyNeon(strings: TemplateStringsArray, ...values: unknown[]) {
  return getDriver()(strings, ...values)
}

export const sql = lazyNeon

// For queries with dynamic column names (validated against whitelist before calling)
export async function sqlRaw(query: string, params: unknown[] = []): Promise<unknown[]> {
  return (getDriver() as unknown as (q: string, p: unknown[]) => Promise<unknown[]>)(query, params)
}
