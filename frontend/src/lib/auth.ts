import { jwtDecode } from 'jwt-decode'
import { cookies } from 'next/headers'

interface JwtPayload {
  sub: string
  email: string
  role: string
  tenantId?: string
  isSuperAdmin: boolean
  exp: number
}

export async function getServerSession() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value
    if (!token) return null
    const payload = jwtDecode<JwtPayload>(token)
    if (payload.exp * 1000 < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const payload = jwtDecode<JwtPayload>(token)
    if (payload.exp * 1000 < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export async function getUserFromCookie() {
  return getServerSession()
}
