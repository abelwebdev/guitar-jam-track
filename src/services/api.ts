import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

type Artist = {
  id: number;
  name: string | null;
  backing_tracks_count: number;
  highlighted?: boolean | null;
};
type BackingTrack = {
  title: string;
  id: number;
  artist_id: number | null;
  track_title: string | null;
  track_url: string | null;
  artist?: {
    id: number;
    artist_name: string | null;
    name?: string | null;
  } | null;
};
type SingleTrack = {
  id: number;
  track_title: string | null;
  track_url: string | null;
  artist?: {
    id: number;
    artist_name: string | null;
    backing_track: string | null;
  } | null;
} | null;
type Playlist = {
  id: number;
  userId: string
  name: string
  trackCount: number;
};
type PlaylistTrack = {
  id: number;
  playlistId: number;
  trackId: number;
};
type User = {
  id: number;
  email: string;
  img: string;
  username: string;
}
export const api = createApi({
  reducerPath: "guitarjamtrackapi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api"}),
  endpoints: (builder) => ({
    sessionLogin: builder.mutation<{ status: string }, { idToken: string; username?: string } >({
      query: ({ idToken }) => ({
        url: "/session",
        method: "POST",
        body: { idToken },
        headers: {
          "Content-Type": "application/json",
        },
      }),
    }),
    sessionLogout: builder.mutation<void, void>({
      query: () => ({
        url: "/logout",
        method: "POST",
        credentials: "include",
      }),
    }),
    getUser: builder.query<Omit<User, 'firebase_user_id' | 'password'>, string>({
      query: (idToken) => ({
        url: '/user',
        method: 'POST',
        body: { idToken },
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      transformResponse: (response: { user: Omit<User, 'firebase_user_id' | 'password'> }) => response.user,
    }),
    deleteUser: builder.mutation<{ status: string; message: string }, { idToken: string }>({
      query: ({ idToken }) => ({
        url: '/user',
        method: 'DELETE',
        body: { idToken },
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    }),
    getHighlightedArtists: builder.query<Artist[], void>({
      query: () => "/gethighlightedartists"
    }),
    getAllArtists: builder.query<Artist[], void>({
      query: () => "/getallartists"
    }),
    getAllTracks: builder.query<BackingTrack[], void>({
      query: () => "/getalltracks"
    }),
    searchTracks: builder.query<BackingTrack[], string>({
      query: (query) => `/search/tracks?q=${encodeURIComponent(query)}`
    }),
    searchArtists: builder.query<Artist[], string>({
      query: (query) => `/search/artists?q=${encodeURIComponent(query)}`
    }),
    getSingleTrack: builder.query<SingleTrack, string>({
      query: (id) => `/getsingletrack?id=${encodeURIComponent(id)}`
    }),
    getArtistTracks: builder.query<BackingTrack[], string>({
      query: (id) => `/getartisttracks?id=${encodeURIComponent(id)}`
    }),
    getPlaylist: builder.query<Playlist[], void>({
      query: () => `/playlist`,
    }),
    getPlaylistTracks: builder.query<BackingTrack[], { id: number }>({
      query: ({ id }) => `/playlisttrack?id=${id}`,
    }),
    createPlaylist: builder.mutation<Playlist, { name: string }>({
      query: (body) => ({
        url: "/playlist",
        method: "POST",
        body,
      }),
    }),
    addTrackToPlaylist: builder.mutation<PlaylistTrack, { playlistId: number; trackId: number }>({
      query: ({ playlistId, trackId }) => ({
        url: `/playlisttrack`, // separate endpoint
        method: "POST",
        body: { playlistId, trackId },
      }),
    }),
    removeTracksFromPlaylist: builder.mutation<void, { playlistId: number; trackIds: number[] }>({
      query: (body) => ({
        url: `/playlisttrack`,
        method: "DELETE",
        body,
      }),
    }),
    deletePlaylist: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/playlist?id=${id}`,
        method: "DELETE",
      }),
      // Optimistically update cache
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
          dispatch(
            api.util.updateQueryData("getPlaylist", undefined, (draft) => {
              return draft.filter((p) => p.id !== id);
            })
          );
        } catch (err) {
          console.error("Delete failed", err);
        }
      },
    }),
    updatePlaylist: builder.mutation({
      query: ({ id, name, removeTracks }: { id: number; name?: string; removeTracks?: number[] }) => ({
        url: `/playlist`, // API reads id from body, not URL
        method: "PATCH",
        body: {
          id,
          name,
          removeTracks,
        },
      }),
    }),
    getTracksByArtist: builder.query<BackingTrack[], string>({
      query: (id) => `/artisttracks?id=${encodeURIComponent(id)}`
    }),
  }),
});

export const { 
  useSessionLoginMutation,
  useSessionLogoutMutation,
  useGetUserQuery,
  useDeleteUserMutation,
  useGetHighlightedArtistsQuery,
  useGetAllTracksQuery, 
  useGetAllArtistsQuery, 
  useSearchTracksQuery, 
  useSearchArtistsQuery,
  useGetSingleTrackQuery,
  useGetArtistTracksQuery,
  useGetPlaylistQuery,
  useCreatePlaylistMutation,
  useAddTrackToPlaylistMutation,
  useDeletePlaylistMutation,
  useGetPlaylistTracksQuery,
  useUpdatePlaylistMutation,
  useRemoveTracksFromPlaylistMutation,
  useGetTracksByArtistQuery,
} = api;