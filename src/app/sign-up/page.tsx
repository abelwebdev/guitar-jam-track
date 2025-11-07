'use client'

import { SignupForm } from "@/components/signup-form"
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebaseClient";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        if (user.emailVerified) {
          router.push("/home");
        }
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </div>
  )
}