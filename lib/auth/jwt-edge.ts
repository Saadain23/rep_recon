// JWT decoder for Edge runtime (no crypto needed, just base64 decode)
// We decode the payload to get user info, then verify against database

export interface JWTPayload {
  userId: string;
  email: string;
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Base64 URL decode
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(decoded);

    // Check if token is expired
    if (parsed.exp && parsed.exp * 1000 < Date.now()) {
      return null;
    }

    return {
      userId: parsed.userId,
      email: parsed.email,
    };
  } catch (error) {
    return null;
  }
}

