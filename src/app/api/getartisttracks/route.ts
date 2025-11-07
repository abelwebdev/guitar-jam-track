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
      include: { backing_tracks: { orderBy: { id: "desc" } } }, // fixed relation name
    });

    if (!artist || artist.backing_tracks.length === 0) {
      return NextResponse.json({ error: "No tracks found" }, { status: 404 });
    }

    return NextResponse.json(artist.backing_tracks);
  } catch (error) {
    console.error("Error fetching artist tracks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
