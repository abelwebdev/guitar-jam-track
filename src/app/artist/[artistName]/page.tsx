import Header from "@/components/Header";
import ArtistTrackList, { BackingTrack } from "./components/ArtistTrackList";

const baseUrl = process.env.BACKEND_URL

interface ArtistPageProps {
  params: {
    artistName: string;
  };
  searchParams: {
    id?: string;
  };
}

async function getArtistTracks(artistId: string): Promise<BackingTrack[] | null> {
  const res = await fetch(
    `${baseUrl}/api/getartisttracks?id=${encodeURIComponent(artistId)}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch artist tracks");
  }
  return res.json();
}

export default async function ArtistPage({ params, searchParams }: ArtistPageProps) {

  const { artistName } = await params;
  const decodedName = decodeURIComponent(artistName).replace(/_/g, " ");  
  const artistId = searchParams.id ?? "";
  const tracks = await getArtistTracks(artistId);
  const count = Array.isArray(tracks) ? tracks.length : 0;

  return (
    <>
      <Header />
      <section className="min-h-screen w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-25 pb-5 sm:pt-24 sm:pb-5 md:pt-28 md:pb-5">
        <div className="py-6 flex items-center justify-center bg-white dark:bg-black">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-black dark:text-white">
              {decodedName}{" "}
              <span className="text-blue-500 dark:text-blue-400">Backing Tracks</span>
            </h1>
            <p className="my-4 sm:my-6 md:my-8 text-base sm:text-lg md:text-xl leading-relaxed text-slate-600 dark:text-gray-300">
              Play and download {decodedName} guitar backing track{count === 1 ? "" : "s"} in MP3 format. Perfect for learning and practice.
            </p>
          </div>
        </div>
        <ArtistTrackList
          tracks={Array.isArray(tracks) ? tracks : null}
          artist={decodedName}
        />
      </section>
    </>
  );
}