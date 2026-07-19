import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics = {
    DATABASE_URL: process.env.DATABASE_URL ? 'âœ… Set' : 'âŒ NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'not set',
    JWT_SECRET: process.env.JWT_SECRET ? 'âœ… Set' : 'âŒ NOT SET',
    dbConnection: null,
    error: null,
  };

  try {
    const { getDb } = require('../../../../lib/db');
    const db = await getDb();
    const result = await db.query('SELECT NOW() as time');
    diagnostics.dbConnection = `âœ… Connected at ${result.rows[0].time}`;
  } catch (err) {
    diagnostics.dbConnection = 'âŒ FAILED';
    diagnostics.error = err.message;
  }

  return NextResponse.json(diagnostics);
}
