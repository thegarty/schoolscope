import { NextRequest, NextResponse } from "next/server";
import { lucia, validateRequest } from "@/auth/lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function POST(request: NextRequest) {
  try {
    const { session } = await validateRequest();
    
    if (!session) {
      // If no session, still redirect to home
      redirect('/');
    }

    await lucia.invalidateSession(session.id);
    
    const sessionCookie = lucia.createBlankSessionCookie();
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    // Redirect to home page after successful logout
    redirect('/');

  } catch (error) {
    console.error("Logout error:", error);
    // Even on error, redirect to home page
    redirect('/');
  }
} 