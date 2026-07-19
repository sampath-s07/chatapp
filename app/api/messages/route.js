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

    const db = getDb();
    const messages = db.prepare(`
      SELECT m.*, 
             su.username as sender_username, su.avatar_color as sender_color,
             ru.username as receiver_username, ru.avatar_color as receiver_color
      FROM messages m
      JOIN users su ON m.sender_id = su.id
      JOIN users ru ON m.receiver_id = ru.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
      LIMIT 100
    `).all(decoded.userId, withUserId, withUserId, decoded.userId);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
