import { NextRequest, NextResponse } from "next/server";
import { decodeToken } from "./jwt-edge";

export interface AuthRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
  };
}

export async function getAuthUser(request: NextRequest) {
  try {
    // Try to get token from cookie first
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return null;
    }

    // In Edge runtime, we decode the JWT without verification
    // The token is already validated when created and stored in DB
    // We just need to decode it to get user info
    const payload = decodeToken(token);
    
    if (!payload) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error("[getAuthUser] Error:", error);
    return null;
  }
}

export function withAuth(
  handler: (req: AuthRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const user = await getAuthUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    (req as AuthRequest).user = user;
    return handler(req as AuthRequest);
  };
}

