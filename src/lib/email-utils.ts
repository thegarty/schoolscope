import { db } from './db';

export async function isUserSubscribed(email: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { emailSubscribed: true },
    });
    
    return user?.emailSubscribed ?? false;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

export async function getSubscribedUsers(emails: string[]): Promise<string[]> {
  try {
    const users = await db.user.findMany({
      where: {
        email: { in: emails },
        emailSubscribed: true,
      },
      select: { email: true },
    });
    
    return users.map(user => user.email);
  } catch (error) {
    console.error('Error getting subscribed users:', error);
    return [];
  }
}

export async function updateSubscriptionStatus(email: string, subscribed: boolean): Promise<boolean> {
  try {
    await db.user.updateMany({
      where: { email },
      data: { emailSubscribed: subscribed },
    });
    
    return true;
  } catch (error) {
    console.error('Error updating subscription status:', error);
    return false;
  }
}

export async function getEmailEvents(email: string, limit: number = 50) {
  try {
    return await db.emailEvent.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    console.error('Error getting email events:', error);
    return [];
  }
}

export async function getBouncedEmails(days: number = 30): Promise<string[]> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    const events = await db.emailEvent.findMany({
      where: {
        eventType: 'BOUNCE',
        bounceType: 'Permanent',
        createdAt: { gte: since },
      },
      select: { email: true },
      distinct: ['email'],
    });
    
    return events.map(event => event.email);
  } catch (error) {
    console.error('Error getting bounced emails:', error);
    return [];
  }
}

export async function getComplaintEmails(days: number = 30): Promise<string[]> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    const events = await db.emailEvent.findMany({
      where: {
        eventType: 'COMPLAINT',
        createdAt: { gte: since },
      },
      select: { email: true },
      distinct: ['email'],
    });
    
    return events.map(event => event.email);
  } catch (error) {
    console.error('Error getting complaint emails:', error);
    return [];
  }
} 