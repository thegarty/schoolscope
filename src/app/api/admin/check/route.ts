import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserAdmin } from '@/lib/admin';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    
    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ isAdmin: false });
  }
} 