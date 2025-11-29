'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearToken, getToken } from "../lib/auth";
import { useRouter } from "next/navigation";

export const Navbar = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const sync = () => setLoggedIn(!!getToken());
    sync();
    window.addEventListener("auth-change", sync);
    return () => window.removeEventListener("auth-change", sync);
  }, []);

  const handleLogout = () => {
    clearToken();
    setLoggedIn(false);
    router.push("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link href="/" className="logo">
          AI Forms
        </Link>
      </div>
      <div className="navbar-right">
        {loggedIn ? (
          <>
            <Link href="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <button className="btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/auth/login" className="nav-link">
              Login
            </Link>
            <Link href="/auth/signup" className="btn-primary">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};
