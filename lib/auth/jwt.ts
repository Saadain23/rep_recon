import jwt from "jsonwebtoken";
import type { StringValue } from "ms";

const JWT_SECRET: string = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN: StringValue = (process.env.JWT_EXPIRES_IN || "7d") as StringValue;

export interface JWTPayload {
  userId: string;
  email: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof Error) {
      console.error("[verifyToken] JWT verification error:", error.message);
    } else {
      console.error("[verifyToken] JWT verification error:", error);
    }
    return null;
  }
}

