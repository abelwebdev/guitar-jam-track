"use client"

import React, { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"
import Header from "./Header"
import { useSessionLoginMutation } from "@/services/api"
import { useRouter } from "next/navigation"
import { auth, googleProvider } from "@/lib/firebaseClient"
import { createUserWithEmailAndPassword, signInWithPopup, sendEmailVerification, getIdToken, updateProfile, fetchSignInMethodsForEmail } from "firebase/auth"

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter();
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionLogin] = useSessionLoginMutation()

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error("Password do not match")
      return
    }
    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user;
      const username = email.split("@")[0];

      await updateProfile(user, { displayName: username });
      await sendEmailVerification(userCredential.user)

      toast.success("Account created! Please check your email (including your Spam/Junk folder) to verify your account.")
      router.push("/sign-in");
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        // Check which sign-in methods exist for this email
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.includes("password")) {
          toast.warning("This email is already registered. Please sign in using your email and password or reset your password if you forgot it.")
        } else {
          toast.warning(`This email is already registered with another provider: ${methods.join(", ")}`)
        }
      } else {
        toast.error(error.message)
      }
    } finally {
      setLoading(false)
    }
  }
  async function handleGoogleSignup() {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider)
      toast.success("Signed up with Google successfully!")
      const user = userCredential.user
      const idToken = await getIdToken(user, true)
      await sessionLogin({ idToken }).unwrap()
      router.push("/home")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <>
      <Header />
      <div className={cn("flex flex-col gap-6 w-full max-w-screen-xl mx-auto pt-28")} {...props}>
        <Card {...props}>
          <CardHeader className="space-y-2">
          <div className="flex flex-col items-center gap-2 text-center">
            <Image
              src="/guitar-jam-track.png"
              alt="Logo"
              width={50}
              height={50}
              className="h-12 w-12 dark:invert"
            />
            <CardTitle className="text-2xl font-bold">
              Guitar JamTrack
            </CardTitle>
          </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleEmailSignup}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Full Name</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </Field>

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
                  <FieldDescription>
                    We will not share your email with anyone else.
                  </FieldDescription>
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
                  <FieldDescription>Must be at least 8 characters long.</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <FieldDescription>Please confirm your password.</FieldDescription>
                </Field>

                <Field>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>

                  <Button variant="outline" type="button" onClick={handleGoogleSignup}>
                    Sign up with Google
                  </Button>

                  <FieldDescription className="px-6 text-center">
                    Already have an account? <Link href="/sign-in">Sign in</Link>
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