import { adminAuth } from "@/lib/firebaseAdmin";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  // 1Check Firebase Admin initialization
  if (!adminAuth) {
    return new Response(
      JSON.stringify({ error: "Firebase auth not initialized" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Parse request body safely
  let body: { idToken?: string };
  try {
    body = await req.json();
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { idToken } = body;

  if (!idToken || typeof idToken !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing or invalid idToken" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Verify Firebase ID token
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid or expired token" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const uid = decoded.uid;

  // Fetch user from database (select only safe fields)
  const dbUser = await prisma.users.findUnique({
    where: { firebase_user_id: uid },
    select: {
      id: true,
      email: true,
      img: true,
      username: true,
    },
  });

  if (!dbUser) {
    return new Response(
      JSON.stringify({ error: "User doesn't exist" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // 5Return success response
  return new Response(
    JSON.stringify({ status: "success", user: dbUser }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store", // prevents caching sensitive info
      },
    }
  );
}

export async function PATCH(req: Request) {
  // Check Firebase Admin initialization
  if (!adminAuth) {
    return new Response(
      JSON.stringify({ error: "Firebase auth not initialized" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Parse request body safely
  let body: { idToken?: string; username?: string; img?: string; password?: string };
  try {
    body = await req.json();
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { idToken, username, img, password } = body;

  if (!idToken || typeof idToken !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing or invalid idToken" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Verify Firebase ID token
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid or expired token" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const uid = decoded.uid;

  // Update Firebase record if password is provided
  if (password) {
    try {
      await adminAuth.updateUser(uid, { password });
    } catch (err) {
      console.error("Failed to update password in Firebase:", err);
      return new Response(
        JSON.stringify({ error: "Failed to update password" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Update record in database
  try {
    const updatedUser = await prisma.users.update({
      where: { firebase_user_id: uid },
      data: {
        ...(username && { username }),
        ...(img && { img }),
      },
      select: {
        id: true,
        email: true,
        img: true,
        username: true,
      },
    });

    return new Response(
      JSON.stringify({ status: "success", user: updatedUser }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      }
    );
  } catch (err) {
    console.error("Failed to update user in DB:", err);
    return new Response(
      JSON.stringify({ error: "Failed to update user in database" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE(req: Request) {
  // Check Firebase Admin initialization
  if (!adminAuth) {
    return new Response(
      JSON.stringify({ error: "Firebase auth not initialized" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Parse request body safely
  let body: { idToken?: string };
  try {
    body = await req.json();
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { idToken } = body;

  if (!idToken || typeof idToken !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing or invalid idToken" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Verify Firebase ID token
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid or expired token" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const uid = decoded.uid;

  // Delete user from Firebase Auth
  try {
    await adminAuth.deleteUser(uid);
  } catch (err) {
    console.error("Failed to delete user from Firebase:", err);
    return new Response(
      JSON.stringify({ error: "Failed to delete user from authentication" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Delete user from Prisma DB
  try {
    await prisma.users.delete({
      where: { firebase_user_id: uid },
    });
  } catch (err) {
    console.error("Failed to delete user from DB:", err);
    return new Response(
      JSON.stringify({ error: "Failed to delete user from database" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Return success response
  return new Response(
    JSON.stringify({ status: "success", message: "User deleted successfully" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    }
  );
}