"use client";

import { useState, useEffect } from "react";
import { User } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export function UserMenu() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 pb-3">
        <div className="h-16 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="px-4 pb-3">
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || user.email}
            className="h-10 w-10 rounded-full border-2 border-border"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-border bg-primary text-primary-foreground">
            <User className="h-5 w-5" />
          </div>
        )}
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="truncate text-sm font-medium text-card-foreground">
            {user.name || "User"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {user.email}
          </p>
        </div>
      </div>
    </div>
  );
}

