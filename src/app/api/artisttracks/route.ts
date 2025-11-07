import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Prisma client singleton

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get("id");

  try {
    if (!idParam) {
      return NextResponse.json({ error: "Track id is required" }, { status: 400 });
    }

    const TrackId = Number(idParam);
    if (!Number.isFinite(TrackId)) {
      return NextResponse.json({ error: "Invalid artist id" }, { status: 400 });
    }

    const track = await prisma.backingTrack.findUnique({
      where: { id: TrackId },
    });

    if (!track) {
      throw new Error("Track not found");
    }

    const backing_tracks = await prisma.backingTrack.findMany({
      where: { artist_id: track.artist_id },
      include: {
        artist: true, // 
      },
    });

    if (!track || backing_tracks.length === 0) {
      return NextResponse.json({ error: "No tracks found" }, { status: 404 });
    }

    return NextResponse.json(backing_tracks);
  } catch (error) {
    console.error("Error fetching artist tracks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
