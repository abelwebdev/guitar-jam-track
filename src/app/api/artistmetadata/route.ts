import { NextRequest, NextResponse } from "next/server";
import { cache } from "react";

type ArtistInput = {
  id: number;
  name: string | null;
};

type ArtistMetadata = {
  image: string | null;
  bio: string | null;
};

const fallbackMetadata: ArtistMetadata = {
  image: null,
  bio: null,
};

const fetchArtistMetadata = cache(async (name: string): Promise<ArtistMetadata> => {
  const formattedName = name.trim();
  const res = await fetch(
    `https://www.theaudiodb.com/api/v1/json/123/search.php?s=${encodeURIComponent(formattedName)}`,
    { next: { revalidate: 60 * 60 * 24 * 7 } }
  );

  if (!res.ok) return fallbackMetadata;

  const data = await res.json();
  const artist = Array.isArray(data?.artists) ? data.artists[0] : null;

  return {
    image: artist?.strArtistThumb ?? null,
    bio: artist?.strBiographyEN ?? null,
  };
});

const fetchMetadataForArtists = async (
  artists: ArtistInput[]
): Promise<Record<number, ArtistMetadata>> => {
  const byNameKey = new Map<string, { displayName: string; ids: number[] }>();

  for (const artist of artists) {
    const displayName = artist.name!.trim();
    const key = displayName.toLowerCase();
    const group = byNameKey.get(key);
    if (group) {
      group.ids.push(artist.id);
    } else {
      byNameKey.set(key, { displayName, ids: [artist.id] });
    }
  }

  const metadataByKey = new Map<string, ArtistMetadata>();
  await Promise.all(
    [...byNameKey.entries()].map(async ([key, { displayName }]) => {
      try {
        metadataByKey.set(key, await fetchArtistMetadata(displayName));
      } catch {
        metadataByKey.set(key, fallbackMetadata);
      }
    })
  );

  const result: Record<number, ArtistMetadata> = {};
  for (const [key, { ids }] of byNameKey) {
    const metadata = metadataByKey.get(key) ?? fallbackMetadata;
    for (const id of ids) {
      result[id] = metadata;
    }
  }
  return result;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const artists = Array.isArray(body?.artists) ? body.artists : [];
    const seenIds = new Set<number>();
    const uniqueArtists = artists
      .filter((artist: ArtistInput) => Number.isInteger(artist?.id) && artist.name?.trim())
      .filter((artist: ArtistInput) => {
        if (seenIds.has(artist.id)) return false;
        seenIds.add(artist.id);
        return true;
      })
      .slice(0, 12);

    const metadataByArtistId = await fetchMetadataForArtists(uniqueArtists);

    const response = NextResponse.json(metadataByArtistId);
    response.headers.set("Cache-Control", "public, s-maxage=604800, stale-while-revalidate=86400");
    return response;
  } catch (error) {
    console.error("Artist metadata error:", error);
    return NextResponse.json(
      { error: "Failed to fetch artist metadata" },
      { status: 500 }
    );
  }
}
