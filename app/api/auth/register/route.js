import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
const { getDb } = require('../../../../lib/db');
const { signToken } = require('../../../../lib/auth');

const AVATAR_COLORS = [
  '#00a884', '#25d366', '#128c7e', '#075e54',
  '#34b7f1', '#e91e63', '#9c27b0', '#ff5722',
  '#607d8b', '#795548',
];

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
    }

    const db = getDb();
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);

    if (existingUser) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const result = db.prepare(
      'INSERT INTO users (username, password, avatar_color) VALUES (?, ?, ?)'
    ).run(username, hashedPassword, color);

    const user = { id: result.lastInsertRowid, username, avatar_color: color };
    const token = signToken({ userId: user.id, username: user.username });

    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
