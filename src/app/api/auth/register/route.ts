import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  void request
  return NextResponse.json(
    {
      error: "Email/password registration is disabled after Clerk migration.",
      redirectTo: "/sign-up",
    },
    { status: 410 }
  );
} 