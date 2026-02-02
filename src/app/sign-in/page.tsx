'use client'

import React, { useState, useEffect } from 'react';
import { Mail, Lock, User } from 'lucide-react';
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth, googleProvider } from "@/lib/firebaseClient";
import { signInWithEmailAndPassword, signInWithPopup, getIdToken, updateProfile, sendPasswordResetEmail, createUserWithEmailAndPassword, sendEmailVerification, fetchSignInMethodsForEmail } from "firebase/auth";
import { useSessionLoginMutation } from "@/services/api";
import Image from "next/image";
import Header from "@/components/Header";

export default function Page() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [sessionLogin] = useSessionLoginMutation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.emailVerified) {
        router.push("/home");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        
        if (!user.emailVerified) {
          toast.error("Email verification required", {
            description: "Please verify your email before signing in. Check your inbox or spam folder."
          });
          await auth.signOut();
          return;
        }
        
        let username = user.displayName;
        if (!username) {
          username = formData.email.split("@")[0];
          await updateProfile(user, { displayName: username });
        }
        
        toast.success("Welcome back!", {
          description: "You've been signed in successfully."
        });
        const idToken = await getIdToken(user, true);
        await sessionLogin({ idToken, username }).unwrap();
        router.push("/home");
      } else {
        if (!formData.name.trim()) {
          toast.error("Name required", {
            description: "Please enter your full name to create an account."
          });
          return;
        }

        const signInMethods = await fetchSignInMethodsForEmail(auth, formData.email);
        if (signInMethods.length > 0) {
          toast.error("Account exists", {
            description: "An account with this email already exists. Please sign in instead."
          });
          setIsLogin(true);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        
        await updateProfile(user, { 
          displayName: formData.name.trim() 
        });
        
        await sendEmailVerification(user);
        await auth.signOut();
        
        toast.success("Account created!", {
          description: "Please check your email and click the verification link before signing in."
        });
        
        setIsLogin(true);
        setFormData(prev => ({ ...prev, password: '' }));
      }
    } catch (error: any) {
      switch (error.code) {
        case "auth/user-not-found":
          toast.error("Account not found", {
            description: "No account exists for this email. Please create an account first."
          });
          setIsLogin(false);
          break;
        case "auth/wrong-password":
          toast.error("Incorrect password", {
            description: "The password you entered is incorrect. Please try again."
          });
          break;
        case "auth/invalid-email":
          toast.error("Invalid email", {
            description: "Please enter a valid email address."
          });
          break;
        case "auth/email-already-in-use":
          toast.error("Email already in use", {
            description: "An account with this email already exists. Please sign in instead."
          });
          setIsLogin(true);
          break;
        case "auth/weak-password":
          toast.error("Weak password", {
            description: "Password should be at least 6 characters long."
          });
          break;
        case "auth/operation-not-allowed":
          toast.error("Sign up disabled", {
            description: "Email/password accounts are not enabled. Please contact support."
          });
          break;
        case "auth/too-many-requests":
          toast.error("Too many attempts", {
            description: "Account temporarily locked due to too many failed attempts. Try again later."
          });
          break;
        case "auth/user-disabled":
          toast.error("Account disabled", {
            description: "This account has been disabled. Please contact support."
          });
          break;
        default:
          toast.error(isLogin ? "Sign in failed" : "Sign up failed", {
            description: error.message || "An unexpected error occurred. Please try again."
          });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;
      toast.success("Welcome!", {
        description: "Successfully signed in with Google."
      });
      const idToken = await getIdToken(user, true);
      await sessionLogin({ idToken }).unwrap();
      router.push("/home");
    } catch (error: any) {
      if (error.code === "auth/popup-closed-by-user") {
        toast.info("Sign in cancelled", {
          description: "Google sign in was cancelled."
        });
      } else if (error.code === "auth/popup-blocked") {
        toast.error("Popup blocked", {
          description: "Please allow popups for this site and try again."
        });
      } else {
        toast.error("Google sign in failed", {
          description: error.message || "An error occurred during Google sign in."
        });
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast.info("Email required", {
        description: "Please enter your email address to reset your password."
      });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, formData.email);
      toast.success("Reset email sent!", {
        description: "Check your inbox or spam folder for password reset instructions."
      });
    } catch (error: any) {
      switch (error.code) {
        case "auth/user-not-found":
          toast.error("Account not found", {
            description: "No account exists with this email address."
          });
          break;
        case "auth/invalid-email":
          toast.error("Invalid email", {
            description: "Please enter a valid email address."
          });
          break;
        case "auth/too-many-requests":
          toast.error("Too many requests", {
            description: "Please wait before requesting another password reset."
          });
          break;
        default:
          toast.error("Reset failed", {
            description: error.message || "Failed to send password reset email."
          });
      }
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 pt-24 pb-8 relative overflow-hidden text-white sm:p-6 sm:pt-28">
        <div className="absolute top-0 left-0 w-full h-full -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full" />
        </div>

        <div className="w-full max-w-sm sm:max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-5">
              <Image
                src="/guitar-jam-track.png"
                alt="Guitar JamTrack Logo"
                width={36}
                height={36}
                className="text-white dark:invert sm:w-10 sm:h-10"
              />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Join Guitar JamTrack'}
            </h2>
            <p className="text-zinc-500 text-sm">Master your craft with the power of AI.</p>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl">
            <div className="flex p-1 bg-black/40 rounded-xl mb-6 border border-zinc-800">
              <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  isLogin ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Login
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  !isLogin ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input 
                      type="text" 
                      placeholder="Jimi Hendrix"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      required
                      className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:bg-black/60 transition-all text-white placeholder-zinc-600" 
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input 
                    type="email" 
                    required
                    placeholder="jimi@strat.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:bg-black/60 transition-all text-white placeholder-zinc-600" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                    Password
                  </label>
                  {isLogin && (
                    <button 
                      type="button" 
                      onClick={handleForgotPassword}
                      className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:bg-black/60 transition-all text-white placeholder-zinc-600" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold mt-6 transition-all shadow-xl shadow-indigo-900/40 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <span className="relative bg-[#09090b] px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                Or continue with
              </span>
            </div>

            <button 
              onClick={handleGoogleAuth}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl border border-zinc-800 hover:bg-zinc-800 transition-all text-zinc-300"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-bold">Google</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}