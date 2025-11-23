import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth/middleware";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;

    if (token) {
      // Delete session from database
      await db.delete(sessions).where(eq(sessions.token, token));
    }

    const response = NextResponse.json({ message: "Logged out successfully" });

    // Clear cookie
    response.cookies.delete("auth-token");

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

