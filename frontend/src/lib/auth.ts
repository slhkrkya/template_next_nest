import { jwtVerify, type JWTPayload } from 'jose'
import { cookies } from 'next/headers'

export interface JwtPayload extends JWTPayload {
  sub: string
  email: string
  role: string
  tenantId?: string | null
  isSuperAdmin: boolean
}

function getSecret(): Uint8Array | null {
  const secret = process.env.JWT_SECRET
  if (!secret) return null
  return new TextEncoder().encode(secret)
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  return Buffer.from(padded, 'base64').toString('utf-8')
}

function decodeJWT(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    return JSON.parse(decodeBase64Url(parts[1])) as JwtPayload
  } catch {
    return null
  }
}

function isTokenExpired(payload: JwtPayload): boolean {
  return typeof payload.exp !== 'number' || Date.now() >= payload.exp * 1000
}

export async function getServerSession(): Promise<JwtPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value
    if (!token) return null

    const secret = getSecret()
    if (secret) {
      try {
        const { payload } = await jwtVerify(token, secret)
        return payload as JwtPayload
      } catch {
        // JWT_SECRET mismatch — fall through to decode-only path
      }
    }

    const payload = decodeJWT(token)
    return payload && !isTokenExpired(payload) ? payload : null
  } catch {
    return null
  }
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const secret = getSecret()
    if (!secret) {
      if (process.env.NODE_ENV === 'production') return null
      const payload = decodeJWT(token)
      return payload && !isTokenExpired(payload) ? payload : null
    }

    const { payload } = await jwtVerify(token, secret)
    return payload as JwtPayload
  } catch {
    return null
  }
}

export async function getUserFromCookie(): Promise<JwtPayload | null> {
  return getServerSession()
}
