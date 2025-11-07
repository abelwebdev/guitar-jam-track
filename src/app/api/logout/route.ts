import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get("jam-track-session")?.value;

  if (!sessionCookie) {
    return NextResponse.json({ message: "No active session" });
  }

  const res = NextResponse.json({ message: "Logged out successfully" });
  res.cookies.set("jam-track-session", "", { path: "/", maxAge: 0 });
  return res;
}