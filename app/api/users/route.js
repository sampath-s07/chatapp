import { NextResponse } from 'next/server';
const { getDb } = require('../../../lib/db');
const { getTokenFromRequest, verifyToken } = require('../../../lib/auth');

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = getDb();
    const users = db.prepare(
      'SELECT id, username, avatar_color, created_at FROM users WHERE id != ? ORDER BY username ASC'
    ).all(decoded.userId);

    return NextResponse.json({ users, currentUserId: decoded.userId });
  } catch (error) {
    console.error('Users error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
