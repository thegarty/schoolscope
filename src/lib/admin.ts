import { db } from './db';
import { lucia } from '@/auth/lucia';
import { cookies } from 'next/headers';

export async function getCurrentUser() {
  try {
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) return null;

    const { session, user } = await lucia.validateSession(sessionId);
    if (!session) return null;

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { isAdmin: true },
    });

    return dbUser?.isAdmin ?? false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function requireAdmin() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    throw new Error('Admin access required');
  }
  return true;
}

export async function makeUserAdmin(email: string): Promise<boolean> {
  try {
    const result = await db.user.updateMany({
      where: { email },
      data: { isAdmin: true },
    });

    return result.count > 0;
  } catch (error) {
    console.error('Error making user admin:', error);
    return false;
  }
} 