import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const artists = await prisma.artist.findMany({
      where: {
        highlighted: true, // only highlighted artists
      },
      include: {
        _count: {
          select: { backing_tracks: true }, // fixed relation name
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    const result = artists.map((artist) => ({
      id: artist.id,
      name: artist.artist_name ?? "Unknown", // handle possible null
      backing_tracks_count: artist._count.backing_tracks, // fixed
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch artists" }, { status: 500 });
  }
}