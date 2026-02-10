'use client'

import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Menu, X  } from 'lucide-react';
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth, googleProvider } from "@/lib/firebaseClient";
import { signInWithEmailAndPassword, signInWithPopup, getIdToken, updateProfile, sendPasswordResetEmail, createUserWithEmailAndPassword, sendEmailVerification, fetchSignInMethodsForEmail } from "firebase/auth";
import { useSessionLoginMutation } from "@/services/api";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Audiowide } from 'next/font/google'
const audiowide = Audiowide({ subsets: ['latin'], weight: '400' })


export default function Page() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [sessionLogin] = useSessionLoginMutation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.emailVerified) {
        router.push("/home");
      } else {
        setCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkingAuth || loading) return;
    
    setLoading(true);
    
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        
        if (!user.emailVerified) {
          toast.error("Verify your email first", {
            description: "Check your inbox for the verification link."
          });
          await auth.signOut();
          return;
        }
        
        let username = user.displayName;
        if (!username) {
          username = formData.email.split("@")[0];
          await updateProfile(user, { displayName: username });
        }
        
        toast.success("Welcome back!");
        const idToken = await getIdToken(user, true);
        await sessionLogin({ idToken, username }).unwrap();
        router.push("/home");
      } else {
        if (!formData.name.trim()) {
          toast.error("Name required");
          return;
        }

        const signInMethods = await fetchSignInMethodsForEmail(auth, formData.email);
        if (signInMethods.length > 0) {
          toast.error("Email already registered", {
            description: "Try signing in instead."
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
        
        toast.success("Check your email", {
          description: "Click the verification link to activate your account."
        });
        
        setIsLogin(true);
        setFormData(prev => ({ ...prev, password: '' }));
      }
    } catch (error: any) {
      switch (error.code) {
        case "auth/user-not-found":
          toast.error("No account found", {
            description: "Create an account to get started."
          });
          setIsLogin(false);
          break;
        case "auth/wrong-password":
          toast.error("Wrong password");
          break;
        case "auth/invalid-email":
          toast.error("Invalid email address");
          break;
        case "auth/email-already-in-use":
          toast.error("Email already registered", {
            description: "Try signing in instead."
          });
          setIsLogin(true);
          break;
        case "auth/weak-password":
          toast.error("Password too weak", {
            description: "Use at least 6 characters."
          });
          break;
        case "auth/operation-not-allowed":
          toast.error("Sign up unavailable", {
            description: "Contact support for help."
          });
          break;
        case "auth/too-many-requests":
          toast.error("Too many attempts", {
            description: "Try again in a few minutes."
          });
          break;
        case "auth/user-disabled":
          toast.error("Account disabled", {
            description: "Contact support for help."
          });
          break;
        default:
          toast.error(isLogin ? "Sign in failed" : "Sign up failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (checkingAuth || loading) return;
    
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;
      toast.success("Welcome!");
      const idToken = await getIdToken(user, true);
      await sessionLogin({ idToken }).unwrap();
      router.push("/home");
    } catch (error: any) {
      if (error.code === "auth/popup-closed-by-user") {
        toast.info("Sign in cancelled");
      } else if (error.code === "auth/popup-blocked") {
        toast.error("Popup blocked", {
          description: "Allow popups and try again."
        });
      } else {
        toast.error("Google sign in failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (checkingAuth || loading) return;
    
    if (!formData.email) {
      toast.info("Enter your email first");
      return;
    }
    
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, formData.email);
      toast.success("Reset link sent", {
        description: "Check your inbox for instructions."
      });
    } catch (error: any) {
      switch (error.code) {
        case "auth/user-not-found":
          toast.error("No account found");
          break;
        case "auth/invalid-email":
          toast.error("Invalid email address");
          break;
        case "auth/too-many-requests":
          toast.error("Too many requests", {
            description: "Wait a few minutes and try again."
          });
          break;
        default:
          toast.error("Reset failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
          <header className="fixed top-0 left-0 right-0 flex py-4 px-4 sm:px-6 min-h-[75px] tracking-wide z-50 bg-zinc-900 shadow-md">
      <div className="flex flex-wrap items-center gap-5 w-full max-w-screen-xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl font-bold hover:opacity-80">
          <Image
            src="/guitar-jam-track.png"
            alt="Guitar JamTrack Logo"
            width={32}
            height={32}
            priority
            className="h-8 w-8 brightness-0 invert"
          />
          <span className="text-white">Guitar JamTrack</span>
        </Link>
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 ml-auto">
          <Link
            href="/tracks"
            className="relative text-white hover:text-indigo-400 font-medium text-[15px]
            transition-colors duration-200 after:content-[''] after:absolute after:left-0 
            after:-bottom-1 after:w-0 after:h-[2px] after:bg-indigo-400
            hover:after:w-full after:transition-all after:duration-300"
          >
            Backing Tracks
          </Link>
          <Link
            href="/artists"
            className="relative text-white hover:text-indigo-400 font-medium text-[15px]
            transition-colors duration-200 after:content-[''] after:absolute after:left-0 
            after:-bottom-1 after:w-0 after:h-[2px] after:bg-indigo-400
            hover:after:w-full after:transition-all after:duration-300"
          >
            Artists
          </Link>
          <Link
            href="/sign-in"
            className="relative text-white hover:text-indigo-400 font-medium text-[15px]
            transition-colors duration-200 after:content-[''] after:absolute after:left-0 
            after:-bottom-1 after:w-0 after:h-[2px] after:bg-indigo-400
            hover:after:w-full after:transition-all after:duration-300"
          >
            Sign In
          </Link>
        </nav>
        {/* Mobile Right Section */}
        <div className="flex items-center lg:hidden ml-auto space-x-3">
          {/* Mobile menu toggle */}
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
          </Button>
        </div>
        {/* Mobile Navigation Drawer */}
        {isClient && mobileOpen && (
          <nav className="lg:hidden fixed top-0 left-0 text-white text-center min-w-[250px] h-full bg-zinc-900 shadow-md p-6 space-y-4 z-50 overflow-auto">
            <Link href="/" className="block font-semibold text-lg hover:text-indigo-400" onClick={() => setMobileOpen(false)}>
              <span className="inline-flex items-center justify-center gap-2">
                <Image src="/guitar-jam-track.png" alt="Guitar JamTrack Logo" width={28} height={28} className="h-7 w-7 brightness-0 invert" />
                  <span className={`${audiowide.className} font-black tracking-tighter text-lg uppercase text-zinc-900 dark:text-white`}>
                    Guitar JamTrack
                  </span>
              </span>
            </Link>
            <Link href="/tracks" className="block hover:text-indigo-400" onClick={() => setMobileOpen(false)}>
              Backing Tracks
            </Link>
            <Link href="/artists" className="block hover:text-indigo-400" onClick={() => setMobileOpen(false)}>
              Artists
            </Link>
            <Link href="/sign-in" className="block hover:text-indigo-400" onClick={() => setMobileOpen(false)}>
              Sign In
            </Link>
          </nav>
        )}
      </div>
    </header>
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
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl">
            <div className="flex p-1 bg-black/40 rounded-xl mb-6 border border-zinc-800">
              <button 
                onClick={() => setIsLogin(true)}
                disabled={checkingAuth || loading}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 ${
                  isLogin ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Login
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                disabled={checkingAuth || loading}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 ${
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
                      disabled={checkingAuth || loading}
                      className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:bg-black/60 transition-all text-white placeholder-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed" 
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
                    disabled={checkingAuth || loading}
                    className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:bg-black/60 transition-all text-white placeholder-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed" 
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
                      disabled={checkingAuth || loading}
                      className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
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
                    disabled={checkingAuth || loading}
                    className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:bg-black/60 transition-all text-white placeholder-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={checkingAuth || loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold mt-6 transition-all shadow-xl shadow-indigo-900/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingAuth ? 'Sign In' : (loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account'))}
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
              disabled={checkingAuth || loading}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl border border-zinc-800 hover:bg-zinc-800 transition-all text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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