import { NextRequest, NextResponse } from "next/server";

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

const fetchArtistMetadata = async (name: string): Promise<ArtistMetadata> => {
  const res = await fetch(
    `https://www.theaudiodb.com/api/v1/json/123/search.php?s=${encodeURIComponent(name)}`,
    { next: { revalidate: 60 * 60 * 24 * 7 } }
  );

  if (!res.ok) return fallbackMetadata;

  const data = await res.json();
  const artist = Array.isArray(data?.artists) ? data.artists[0] : null;

  return {
    image: artist?.strArtistThumb ?? null,
    bio: artist?.strBiographyEN ?? null,
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const artists = Array.isArray(body?.artists) ? body.artists : [];
    const uniqueArtists = artists
      .filter((artist: ArtistInput) => Number.isInteger(artist?.id) && artist.name?.trim())
      .slice(0, 12);

    const entries = await Promise.all(
      uniqueArtists.map(async (artist: ArtistInput) => {
        try {
          const metadata = await fetchArtistMetadata(artist.name!.trim());
          return [artist.id, metadata] as const;
        } catch {
          return [artist.id, fallbackMetadata] as const;
        }
      })
    );

    const response = NextResponse.json(Object.fromEntries(entries));
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
