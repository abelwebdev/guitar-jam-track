import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query?.trim()) {
      return NextResponse.json([]);
    }

    const artists = await prisma.artist.findMany({
      where: {
        artist_name: {
          not: null,
          contains: query,
          mode: "insensitive",
        },
      },
      include: {
        _count: {
          select: { backing_tracks: true },
        },
      },
      orderBy: {
        artist_name: "asc",
      },
    });

    const result = artists.map((artist) => ({
      id: artist.id,
      name: artist.artist_name,
      backing_tracks_count: artist._count.backing_tracks,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Search artists error:", error);
    return NextResponse.json(
      { error: "Failed to search artists" },
      { status: 500 }
    );
  }
}