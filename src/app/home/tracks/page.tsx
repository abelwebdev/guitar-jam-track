'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { useGetAllTracksQuery, useSearchTracksQuery } from "@/services/api";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";

export default function Tracks() {
  const pageSize = 16;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allTracks, isLoading: isAllTracksLoading, error: isAllTracksError } = useGetAllTracksQuery();
  const { data: searchResults, isLoading: isSearchLoading, error: isSearchError } = useSearchTracksQuery(
    searchQuery,
    { skip: !searchQuery.trim() }
  );

  // Use search results if searching, otherwise use all tracks
  const tracks = searchQuery.trim() ? searchResults : allTracks;
  const isTrackLoading = searchQuery.trim() ? isSearchLoading : isAllTracksLoading;
  const isTrackError = searchQuery.trim() ? isSearchError : isAllTracksError;

  // Reset pagination whenever the search query changes
  useEffect(() => setCurrentPage(1), [searchQuery]);

  const handleSearch = (query: string) => setSearchQuery(query);

  const totalPages = Math.max(1, Math.ceil((tracks?.length ?? 0) / pageSize));

  return (
    <div className="min-h-screen w-full max-w-screen-xl mx-auto px-4 sm:px-6 -mb-28">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tracks</h1>
          <p className="text-muted-foreground">
            {searchQuery.trim() ? `Search results for '${searchQuery}'` : "Browse all tracks."}
          </p>
        </div>
        <div className="hidden md:block text-sm text-muted-foreground">
          {isTrackLoading ? (
            <span>Loading…</span>
          ) : isTrackError ? (
            <span>Failed to load</span>
          ) : (
            <span>
              Showing {Math.min((currentPage - 1) * pageSize + 1, tracks?.length ?? 0)}-
              {Math.min(currentPage * pageSize, tracks?.length ?? 0)} of {tracks?.length ?? 0}
            </span>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <SearchInput
          placeholder="Search tracks by title or artist..."
          onSearch={handleSearch}
          className="max-w-md"
        />
      </div>

      {/* Track Grid */}
      {isTrackLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: pageSize }).map((_, idx) => (
            <div key={idx} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : isTrackError ? (
        <div className="text-destructive">Unable to load tracks.</div>
      ) : tracks?.length ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {tracks
              ?.slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map((track) => (
                <Link
                  key={track.id}
                  href={`/home/track/${(track.title ?? "untitled").replace(/\s+/g, "_")}?id=${track.id}`}
                >
                  <div className="rounded-lg border p-4 hover:shadow-sm transition-shadow bg-white dark:bg-[#101010] cursor-pointer">
                    <div className="font-semibold line-clamp-1">
                      {track.title ?? "Untitled"}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {(track.artist?.artist_name || track.artist?.name) ?? "Unknown artist"}
                    </div>
                  </div>
                </Link>
              ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Prev
            </Button>
            <div className="text-sm px-2">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          {searchQuery.trim() ? (
            <div>
              <p className="text-muted-foreground">No tracks found for &quot;{searchQuery}&quot;</p>
              <p className="text-sm text-muted-foreground mt-2">Try searching with different keywords</p>
            </div>
          ) : (
            <p>No tracks available.</p>
          )}
        </div>
      )}
    </div>
  );
}