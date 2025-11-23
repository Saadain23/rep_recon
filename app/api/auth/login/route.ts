import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "This account uses OAuth login. Please use Google sign in." },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session
    const token = signToken({
      userId: user.id,
      email: user.email,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Create session - this is critical for authentication
    try {
      await db.insert(sessions).values({
        userId: user.id,
        token,
        expiresAt,
      });
      console.log("[login] Session created successfully for user:", user.email);
    } catch (sessionError) {
      console.error("[login] Failed to create session:", sessionError);
      throw sessionError; // Don't continue if session creation fails
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    });

    // Set cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    console.log("[login] Cookie set, token length:", token.length);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

