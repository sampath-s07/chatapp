import { NextResponse } from 'next/server';
const { getDb } = require('../../../lib/db');
const { getTokenFromRequest, verifyToken } = require('../../../lib/auth');

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const withUserId = searchParams.get('with');

    if (!withUserId) {
      return NextResponse.json({ error: 'Missing with parameter' }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.query(`
      SELECT m.*, 
             su.username as sender_username, su.avatar_color as sender_color,
             ru.username as receiver_username, ru.avatar_color as receiver_color
      FROM messages m
      JOIN users su ON m.sender_id = su.id
      JOIN users ru ON m.receiver_id = ru.id
      WHERE (m.sender_id = $1 AND m.receiver_id = $2)
         OR (m.sender_id = $3 AND m.receiver_id = $4)
      ORDER BY m.created_at ASC
      LIMIT 100
    `, [decoded.userId, withUserId, withUserId, decoded.userId]);
    const messages = result.rows;

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
