import Header from "@/components/Header";
import ArtistGrid from "./components/ArtistGrid";

export default async function ArtistsPage() {
  return (
    <>
      <Header />
      <section className="min-h-screen w-full max-w-screen-xl mx-auto py-28">
        <div className="py-3 flex items-center justify-center bg-white dark:bg-black">
          <div className="mx-auto max-w-[50rem] text-center">
            <h1 className="my-3 sm:my-4 md:my-8 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-10 tracking-tight text-black dark:text-white">
              Browse By <span className="text-blue-500 dark:text-blue-500">Artist</span>
            </h1>
            <p className="my-3 sm:my-4 md:my-8 text-lg leading-relaxed text-slate-500 dark:text-gray-300">
              Explore backing tracks from various legendary artists. Find your favorite guitarists and discover new ones.
            </p>
          </div>
        </div>
        <ArtistGrid pageSize={16} />
      </section>
    </>
  );
}
