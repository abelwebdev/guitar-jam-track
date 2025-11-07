import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get("id"); // remove 'await'

  try {
    if (!idParam) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const id = Number(idParam);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const track = await prisma.backingTrack.findUnique({
      where: { id },
      include: {
        artist: {
          include: {
            backing_tracks: { // fixed relation name
              orderBy: { track_title: "asc" },
            },
          },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    return NextResponse.json(track);
  } catch (error) {
    console.error("Error fetching single track:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}