import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Prisma client singleton

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get("id");

  try {
    if (!idParam) {
      return NextResponse.json({ error: "Artist id is required" }, { status: 400 });
    }

    const artistId = Number(idParam);
    if (!Number.isFinite(artistId)) {
      return NextResponse.json({ error: "Invalid artist id" }, { status: 400 });
    }

    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      include: { 
        backing_tracks: { 
          orderBy: { id: "desc" },
          include: { artist: true } // Include artist information in tracks
        } 
      },
    });

    if (!artist || artist.backing_tracks.length === 0) {
      return NextResponse.json({ error: "No tracks found" }, { status: 404 });
    }

    // Map to frontend-friendly structure
    const result = artist.backing_tracks.map((track) => ({
      id: track.id,
      track_title: track.track_title,
      track_url: track.track_url,
      artist: {
        id: track.artist?.id ?? artist.id,
        artist_name: track.artist?.artist_name ?? artist.artist_name,
        name: track.artist?.artist_name ?? artist.artist_name
      }
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching artist tracks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
