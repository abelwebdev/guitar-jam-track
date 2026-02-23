
import { adminAuth } from "@/lib/firebaseAdmin";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    if (!adminAuth) throw new Error("Firebase Admin not initialized");
    const { idToken, username: usernameFromClient } = await req.json();
    if (!idToken) {
      return new Response(JSON.stringify({ error: "Missing idToken" }), {
        status: 400,
      });
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    // fetch full user record
    const userRecord = await adminAuth.getUser(uid);
    const email = userRecord.email ?? "";
    const img = userRecord.photoURL ?? "";
    // Use username passed from client first, then Firebase displayName, then fallback to email prefix
    const username = usernameFromClient?.trim() || userRecord.displayName || email.split("@")[0];
    // Create user only once in DB
    let dbUser = await prisma.users.findUnique({
      where: { firebase_user_id: uid },
    });
    if (!dbUser) {
      // Create new user
      dbUser = await prisma.users.create({
        data: {
          firebase_user_id: uid,
          email,
          username,
          img,
        },
      });
    }
    // create Firebase session cookie
    const expiresIn = 60 * 60 * 24 * 14 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Set-Cookie": `jam-track-session=${sessionCookie}; HttpOnly; Path=/; Max-Age=${Math.floor(
          expiresIn / 1000
        )}; Secure; SameSite=Lax`,
      },
    });
  } catch (err) {
    console.error("Auth error:", err);
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
}