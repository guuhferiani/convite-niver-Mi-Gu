import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ AVISO: DATABASE_URL não definida nas variáveis de ambiente');
}

export const sql = neon(process.env.DATABASE_URL || '');

export async function query(queryString, params = []) {
  try {
    const result = await sql(queryString, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
