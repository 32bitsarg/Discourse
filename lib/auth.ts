import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import pool from './db'

export interface User {
  id: number
  username: string
  email: string
  avatar_url?: string
  karma: number
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function getUserByUsername(username: string) {
  const [rows] = await pool.execute(
    'SELECT id, username, email FROM users WHERE username = ?',
    [username]
  ) as any[]

  return rows[0]
}

export async function createUser(username: string, email: string, password: string): Promise<User> {
  // Verificar si el username ya existe
  const existingUsername = await getUserByUsername(username)
  if (existingUsername) {
    throw new Error('Este nombre de usuario ya está en uso')
  }

  const hashedPassword = await hashPassword(password)
  
  const [result] = await pool.execute(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    [username, email, hashedPassword]
  ) as any

  return {
    id: result.insertId,
    username,
    email,
    karma: 0,
  }
}

export async function getUserByEmail(email: string) {
  const [rows] = await pool.execute(
    'SELECT id, username, email, email_verified, password_hash, avatar_url, karma FROM users WHERE email = ?',
    [email]
  ) as any[]

  return rows[0]
}

export async function getUserById(id: number): Promise<User | null> {
  const [rows] = await pool.execute(
    'SELECT id, username, email, email_verified, avatar_url, karma FROM users WHERE id = ?',
    [id]
  ) as any[]

  return rows[0] || null
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value

  if (!userId) {
    return null
  }

  return getUserById(parseInt(userId))
}

export async function setUserSession(userId: number) {
  const cookieStore = await cookies()
  cookieStore.set('user_id', userId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearUserSession() {
  const cookieStore = await cookies()
  cookieStore.delete('user_id')
}

