"use client";

import { useState } from "react";
import { useGetAllArtistsQuery, useSearchArtistsQuery } from "@/services/api";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import Link from "next/link";


export default function Tracks() {
  const pageSize = 16;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: allArtists, isLoading: isAllArtistsLoading, error: isAllArtistsError } = useGetAllArtistsQuery();
  const { data: searchResults, isLoading: isSearchLoading, error: isSearchError } = useSearchArtistsQuery(
    searchQuery,
    { skip: !searchQuery.trim() }
  );

  // Use search results if searching, otherwise use all artists
  const artists = searchQuery.trim() ? searchResults : allArtists;
  const isArtistLoading = searchQuery.trim() ? isSearchLoading : isAllArtistsLoading;
  const isArtistError = searchQuery.trim() ? isSearchError : isAllArtistsError;

  const handleSearch = (query: string) => {
    // Only reset pagination if the search query actually changed
    if (query !== searchQuery) {
      setSearchQuery(query);
      setCurrentPage(1); // Reset to first page when searching
    }
  };
  return (
    <div className="mx-4 sm:mx-5 md:mx-5">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Artists</h1>
          <p className="text-muted-foreground">
            {searchQuery.trim() ? `Search results for '${searchQuery}'` : "Browse all artists."}
          </p>
        </div>
        <div className="hidden md:block text-sm text-muted-foreground">
          {isArtistLoading ? (
            <span>Loading…</span>
          ) : isArtistError ? (
            <span>Failed to load</span>
          ) : (
            <span>
              Showing {Math.min((currentPage - 1) * pageSize + 1, artists?.length ?? 0)}-
              {Math.min(currentPage * pageSize, artists?.length ?? 0)} of {artists?.length ?? 0}
            </span>
          )}
        </div>
      </div>
      {/* Search Input */}
      <div className="mb-6">
        <SearchInput
          placeholder="Search artists by name..."
          onSearch={handleSearch}
          className="max-w-md"
        />
      </div>
      {/* Artist Grid */}
      {isArtistLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}
      {!isArtistLoading && isArtistError && (
        <div className="text-destructive">Unable to load Artists.</div>
      )}
      {!isArtistLoading && !isArtistError && (artists?.length ?? 0) > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {artists
            ?.slice((currentPage - 1) * pageSize, currentPage * pageSize)
            .map((artist, idx) => (
              <Link
                key={String(artist.id ?? artist.name ?? idx)}
                href={`/home/artist/${encodeURIComponent(artist?.name?.replace(/\s+/g, "_") ?? "")}?id=${artist.id}`}
              >
                <div className="rounded-lg border p-4 hover:shadow-sm transition-shadow bg-white dark:bg-[#101010] cursor-pointer">
                  <div className="font-semibold line-clamp-1">
                    {artist.name ?? "Untitled"}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {artist.backing_tracks_count} Tracks
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Prev
            </Button>
            <div className="text-sm px-2">
              Page {currentPage} of {Math.max(1, Math.ceil((artists?.length ?? 0) / pageSize))}
            </div>
            <Button
              variant="outline"
              onClick={() =>
                setCurrentPage((p) =>
                  Math.min(Math.ceil((artists?.length ?? 0) / pageSize), p + 1)
                )
              }
              disabled={currentPage >= Math.max(1, Math.ceil((artists?.length ?? 0) / pageSize))}
            >
              Next
            </Button>
          </div>
        </>
      )}
      {!isArtistLoading && !isArtistError && artists?.length === 0 && (
        <div className="text-center py-8">
          {searchQuery.trim() ? (
            <div>
              <p className="text-muted-foreground">No artists found for &quot;{searchQuery}&quot;</p>
              <p className="text-sm text-muted-foreground mt-2">Try searching with different keywords</p>
            </div>
          ) : (
            <p>No Artists available.</p>
          )}
        </div>
      )}
    </div>
  )
}