"use client"

import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import Header from "./Header"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"
import { useSessionLoginMutation } from "@/services/api"
import { useRouter } from "next/navigation"
// Firebase
import { auth, googleProvider } from "@/lib/firebaseClient"
import { signInWithEmailAndPassword, signInWithPopup, onAuthStateChanged, getIdToken, updateProfile, sendPasswordResetEmail } from "firebase/auth"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionLogin] = useSessionLoginMutation()
  const [checkingAuth, setCheckingAuth] = useState(true)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Check email verification
      if (!user.emailVerified) {
        toast.info("Please verify your email before logging in. Check your inbox or spam folder.")
        await auth.signOut();
        return;
      }
      // Set displayName only if missing
      let username = user.displayName;
      if (!username) {
        username = email.split("@")[0]; // fallback
        await updateProfile(user, { displayName: username });
      }
      toast.success("Logged in successfully!")
      // Get fresh ID token
      const idToken = await getIdToken(user, true);
      // Send token + username to backend
      await sessionLogin({ idToken, username }).unwrap();
      // Redirect
      router.push("/home");
    } catch (error: any) {
      switch (error.code) {
        case "auth/user-not-found":
          toast.error("No account exists for this email. Redirecting to Sign Up...")
          router.push("/sign-up")
          break

        case "auth/wrong-password":
          toast.error("Incorrect password. Try again.");
          break

        case "auth/invalid-email":
          toast.error("Invalid email format")
          break

        default:
          toast.error(error.message)
      }
    } finally {
      setLoading(false)
    }
  }
  async function handleGoogleLogin() {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider)
      const user = userCredential.user
      toast.success("login success!")
      const idToken = await getIdToken(user, true)
      await sessionLogin({ idToken }).unwrap()
      router.push("/home")
    } catch (error: any) {
      toast.error(error.message)
    }
  }
  async function handleForgotPassword() {
    if (!email) {
      toast.info("Please enter your email to reset password.")
      return
    }
    try {
      await sendPasswordResetEmail(auth, email)
      toast.info("Password reset email sent! Check your inbox or spam folder.")
    } catch (error: any) {
      switch (error.code) {
        case "auth/user-not-found":
          toast.info("No account exists with this email.")
          break
        case "auth/invalid-email":
          toast.info("Invalid email fomrat.")
          break
        default:
          toast.error(error.message);
      }
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCheckingAuth(false);
      if (!user) return;
      if (!user.emailVerified) {
        toast.info("Please verify your email before accessing the app.")
        return;
      }
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <>
      <Header />
      <div className={cn("flex flex-col gap-6 w-full max-w-screen-xl mx-auto pt-28", className)} {...props}>
        <Card>
          <div className="flex flex-col items-center gap-2 text-center">
            <Image
              src="/guitar-jam-track.png"
              alt="Logo"
              width={50}
              height={50}
              className="h-12 w-12 dark:invert"
            />
            <CardTitle className="text-2xl font-bold">Guitar JamTrack</CardTitle>
          </div>

          <CardHeader>
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>
              Enter your email below to log in to your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleEmailLogin}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>

                <Field className="flex flex-col items-center gap-2">
                  <Button type="submit" disabled={loading || checkingAuth} >
                    {loading ? "Logging in..." : "Login"}
                  </Button>

                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={checkingAuth}
                  >
                    Login with Google
                  </Button>

                  {/* Forgot password link */}
                  <Button
                    variant="link"
                    type="button"
                    className="text-sm"
                    disabled={checkingAuth}
                    onClick={handleForgotPassword}
                  >
                    Forgot password?
                  </Button>

                  <FieldDescription className="text-center">
                    Don&apos;t have an account? <Link href="/sign-up">Sign up</Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}