import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tracks = await prisma.backingTrack.findMany({
      include: {
        artist: true, // include related artist
      },
      orderBy: {
        id: "asc", // order by track title
      },
    });
    // Map to frontend-friendly structure
    const result = tracks.map((track) => ({
      id: track.id,
      title: track.track_title ?? "Untitled",
      artist: {
        id: track.artist?.id ?? null,
        artist_name: track.artist?.artist_name ?? "Unknown artist",
      },
      track_url: track.track_url ?? null,
    }));
    return NextResponse.json(result);
  } catch (error) {
    console.error("Fetch all tracks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch all tracks" },
      { status: 500 }
    );
  }
}