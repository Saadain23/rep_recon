import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, accounts, sessions } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        name: name || null,
        passwordHash,
      })
      .returning();

    // Create account
    await db.insert(accounts).values({
      userId: newUser.id,
      type: "credentials",
      provider: "credentials",
      providerAccountId: newUser.id,
    });

    // Create session
    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db.insert(sessions).values({
      userId: newUser.id,
      token,
      expiresAt,
    });

    const response = NextResponse.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      },
      { status: 201 }
    );

    // Set cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

