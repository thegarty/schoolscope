'use server'

import { validateRequest, lucia } from "@/auth/lucia"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function logout() {
  const { session } = await validateRequest();
  
  if (session) {
    await lucia.invalidateSession(session.id);
    const sessionCookie = lucia.createBlankSessionCookie();
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  }
  
  redirect('/');
} 