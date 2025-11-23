import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [userData] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(eq(users.id, user.userId))
      .limit(1);

    if (!userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

