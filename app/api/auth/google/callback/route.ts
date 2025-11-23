import { NextRequest, NextResponse } from "next/server";
import { getGoogleTokens, getGoogleUserInfo, verifyGoogleToken } from "@/lib/auth/google";
import { db } from "@/lib/db";
import { users, accounts, sessions } from "@/lib/db/schema";
import { signToken } from "@/lib/auth/jwt";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL("/login?error=oauth_error", req.nextUrl.origin)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/login?error=no_code", req.nextUrl.origin)
      );
    }

    // Exchange code for tokens
    const tokens = await getGoogleTokens(code);
    if (!tokens || !tokens.id_token) {
      return NextResponse.redirect(
        new URL("/login?error=token_exchange_failed", req.nextUrl.origin)
      );
    }

    // Verify and get user info from token
    const payload = await verifyGoogleToken(tokens.id_token);
    if (!payload || !payload.email) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_token", req.nextUrl.origin)
      );
    }

    const email = payload.email;
    const name = payload.name || null;
    const image = payload.picture || null;
    const googleId = payload.sub;

    // Find or create user
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      // Create new user
      [user] = await db
        .insert(users)
        .values({
          email,
          name,
          image,
          emailVerified: new Date(),
        })
        .returning();
    } else {
      // Update existing user if needed
      if (!user.image && image) {
        await db
          .update(users)
          .set({ image, emailVerified: new Date() })
          .where(eq(users.id, user.id));
        user.image = image;
      }
    }

    // Find or create account
    const [existingAccount] = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.provider, "google"),
          eq(accounts.providerAccountId, googleId)
        )
      )
      .limit(1);

    if (!existingAccount) {
      await db.insert(accounts).values({
        userId: user.id,
        type: "oauth",
        provider: "google",
        providerAccountId: googleId,
        accessToken: tokens.access_token || null,
        refreshToken: tokens.refresh_token || null,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        idToken: tokens.id_token || null,
      });
    } else {
      // Update account tokens
      await db
        .update(accounts)
        .set({
          accessToken: tokens.access_token || null,
          refreshToken: tokens.refresh_token || null,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          idToken: tokens.id_token || null,
        })
        .where(eq(accounts.id, existingAccount.id));
    }

    // Create session
    const token = signToken({
      userId: user.id,
      email: user.email,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // Redirect to home with cookie set
    const response = NextResponse.redirect(new URL("/", req.nextUrl.origin));
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Google callback error:", error);
    return NextResponse.redirect(
      new URL("/login?error=internal_error", req.nextUrl.origin)
    );
  }
}

