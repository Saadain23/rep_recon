# Authentication Setup Guide

This guide will help you set up authentication for Rep Recon with JWT and Google OAuth.

## Prerequisites

1. PostgreSQL database (local or remote)
2. Google OAuth credentials (for Google sign-in)

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/rep_recon

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# App URL (for OAuth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Anthropic API (existing)
ANTHROPIC_API_KEY=your-anthropic-api-key
```

## Database Setup

1. **Create the database:**
   ```bash
   createdb rep_recon
   # Or use your PostgreSQL client
   ```

2. **Generate migrations:**
   ```bash
   npm run db:generate
   ```

3. **Apply migrations:**
   ```bash
   npm run db:push
   # Or use: npm run db:migrate
   ```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (for development)
   - `https://yourdomain.com/api/auth/google/callback` (for production)
7. Copy the Client ID and Client Secret to your `.env.local` file

## Running the Application

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Access the application:**
   - Open `http://localhost:3000`
   - You'll be redirected to `/login` if not authenticated
   - Sign up with email/password or use Google sign-in

## Authentication Features

### JWT Authentication
- Email/password signup and login
- Secure password hashing with bcrypt
- JWT tokens stored in HTTP-only cookies
- Session management in database

### Google OAuth
- One-click Google sign-in
- Automatic user creation
- Profile picture and name sync

### Route Protection
- All routes except `/login` and `/signup` require authentication
- API routes are protected with `withAuth` middleware
- Automatic redirect to login for unauthenticated users

## API Endpoints

- `POST /api/auth/signup` - Create a new account
- `POST /api/auth/login` - Sign in with email/password
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/google` - Get Google OAuth URL
- `GET /api/auth/google/callback` - Google OAuth callback

## Database Schema

The authentication system uses three main tables:

- **users**: User accounts with email, name, password hash, etc.
- **accounts**: OAuth account links (Google, etc.)
- **sessions**: Active user sessions with JWT tokens

## Security Notes

1. **JWT_SECRET**: Use a strong, random secret in production
2. **HTTPS**: Always use HTTPS in production
3. **Cookies**: HTTP-only cookies prevent XSS attacks
4. **Password Hashing**: Passwords are hashed with bcrypt (10 rounds)
5. **Session Expiry**: Sessions expire after 7 days (configurable)

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check database permissions

### Google OAuth Not Working
- Verify redirect URI matches exactly in Google Console
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Ensure `NEXT_PUBLIC_APP_URL` is set correctly

### Authentication Errors
- Check browser console for errors
- Verify JWT_SECRET is set
- Check database connection
- Review server logs for detailed error messages

