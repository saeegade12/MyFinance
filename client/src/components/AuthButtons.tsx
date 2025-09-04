import React from "react";
import { useAuth } from "../hooks/useAuth";

export default function AuthButtons() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        {user.claims?.profile_image_url && (
          <img
            src={user.claims.profile_image_url}
            alt="profile"
            className="w-8 h-8 rounded-full"
          />
        )}
        <span className="text-sm">
          {user.claims?.first_name} {user.claims?.last_name}
        </span>
        <a
          href="/api/logout"
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </a>
      </div>
    );
  }

  return (
    <a
      href="/api/login"
      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Sign In
    </a>
  );
}
