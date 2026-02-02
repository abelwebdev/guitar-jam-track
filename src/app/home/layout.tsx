"use client"

import { ReactNode } from "react"
import { Toaster } from "sonner"
import { signOut } from "firebase/auth";
import { useState, useEffect } from "react"
import { useGetUserQuery, useSessionLogoutMutation } from "@/services/api"
import { auth } from "@/lib/firebaseClient"
import { onAuthStateChanged, getIdToken } from "firebase/auth"
import { useRouter } from "next/navigation";

export default function HomeLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [idToken, setIdToken] = useState<string | null>(null);
  const { data: user, isLoading: userLoading, error: userError } = useGetUserQuery(idToken!, {
    skip: !idToken,
  });
  const [logout, { isLoading }] = useSessionLogoutMutation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await getIdToken(user, true);
        setIdToken(token);
      } else {
        setIdToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen">
      <Toaster
        position="top-center"
        richColors
      />
      {/* Main Content */}
      <main className="px-4 pt-5">
        {children}
      </main>
    </div>
  )
}