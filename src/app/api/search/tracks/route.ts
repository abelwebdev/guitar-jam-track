import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    // Return empty array if no query
    if (!query?.trim()) {
      return NextResponse.json([]);
    }

    // Search tracks by title or artist name
    const tracks = await prisma.backingTrack.findMany({
      where: {
        OR: [
          {
            track_title: {
              not: null,
              contains: query,
              mode: "insensitive",
            },
          },
          {
            artist: {
              artist_name: {
                not: null,
                contains: query,
                mode: "insensitive",
              },
            },
          },
        ],
      },
      include: {
        artist: true,
      },
      orderBy: {
        track_title: "asc",
      },
    });

    // Map to clean response
    const result = tracks.map((track) => ({
      id: track.id,
      title: track.track_title,
      url: track.track_url,
      artist: track.artist
        ? { id: track.artist.id, name: track.artist.artist_name }
        : null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Search tracks error:", error);
    return NextResponse.json(
      { error: "Failed to search tracks" },
      { status: 500 }
    );
  }
}