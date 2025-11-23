import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/google/callback`
);

export async function verifyGoogleToken(token: string) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
  } catch (error) {
    console.error("Error verifying Google token:", error);
    return null;
  }
}

export function getGoogleAuthUrl(): string {
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];

  return client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });
}

export async function getGoogleTokens(code: string) {
  try {
    const { tokens } = await client.getToken(code);
    return tokens;
  } catch (error) {
    console.error("Error getting Google tokens:", error);
    return null;
  }
}

export async function getGoogleUserInfo(accessToken: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch user info");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching Google user info:", error);
    return null;
  }
}

