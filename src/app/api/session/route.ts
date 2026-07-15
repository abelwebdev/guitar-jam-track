
import { adminAuth } from "@/lib/firebaseAdmin";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    if (!adminAuth) throw new Error("Firebase Admin not initialized");
    const { idToken, username: usernameFromClient } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    // fetch full user record
    const userRecord = await adminAuth.getUser(uid);
    const email = userRecord.email ?? null;
    const username =
      typeof usernameFromClient === "string" && usernameFromClient.trim()
        ? usernameFromClient.trim()
        : userRecord.displayName ?? email?.split("@")[0] ?? null;
    // Create user only once in DB
    await prisma.users.upsert({
      where: email ? { email } : { firebase_user_id: uid },
      update: {
        firebase_user_id: uid,    // keep firebase_user_id fresh if it ever changes
        email,
      },
      create: {
        firebase_user_id: uid,
        email,
        username,
        img: userRecord.photoURL,
      },
    });
    // create Firebase session cookie
    const expiresIn = 60 * 60 * 24 * 14 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: "jam-track-session",
      value: sessionCookie,
      httpOnly: true,
      path: "/",
      maxAge: Math.floor(expiresIn / 1000),
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (err) {
    console.error("Auth error:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
