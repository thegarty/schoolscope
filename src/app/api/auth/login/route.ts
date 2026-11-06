import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  void request
  return NextResponse.json(
    {
      error: "Email/password login is disabled Use the AllAuth sign-in and sign-up pages.",
      redirectTo: "/sign-in",
    },
    { status: 410 }
  );
} 