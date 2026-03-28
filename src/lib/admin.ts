import { db } from './db';
import { getAuthUser } from '@/lib/auth';

export async function getCurrentUser() {
  try {
    return await getAuthUser();
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