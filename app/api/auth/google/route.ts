import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/auth/google";

export async function GET(req: NextRequest) {
  try {
    const authUrl = getGoogleAuthUrl();
    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json(
      { error: "Failed to generate Google auth URL" },
      { status: 500 }
    );
  }
}

