import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminAuth } from "@/lib/firebaseAdmin";

// Helper to get Firebase user from request
export async function getFirebaseUser(req: NextRequest) {
  try {
    // Read token from cookie named "idToken"
    const sessionCookie = req.cookies.get("jam-track-session")?.value;

    if (!sessionCookie) {
      return null; // no token found
    }

    // Verify the token with Firebase Admin
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true); 
       return decoded; // contains uid, email, etc.
  } catch (err) {
    console.error("Failed to verify Firebase ID token:", err);
    return null;
  }
}
// ------------------- GET tracks of a playlist -------------------
export async function GET(req: NextRequest) {
  try {
    const firebaseUser = await getFirebaseUser(req);
    if (!firebaseUser) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 });

    // Verify playlist belongs to user
    const user = await prisma.users.findUnique({ where: { firebase_user_id: firebaseUser.uid } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const playlist = await prisma.playlist.findUnique({ where: { id } });
    if (!playlist || playlist.userId !== user.id) return NextResponse.json({ error: "Unauthorized or playlist not found" }, { status: 403 });

    const playlistTracks = await prisma.playlistTrack.findMany({
      where: { playlistId: id },
      include: { track: { include: { artist: true } } },
    });

    if (!playlistTracks.length) {
      return NextResponse.json([], { status: 200 });
    }

    const tracks = playlistTracks.map((pt) => pt.track);
    return NextResponse.json(tracks, { status: 200 });
  } catch (err) {
    console.error("Error fetching playlist tracks:", err);
    return NextResponse.json({ error: "Error fetching playlist tracks" }, { status: 500 });
  }
}

// ------------------- POST add track to playlist -------------------
export async function POST(req: NextRequest) {
  try {
    const firebaseUser = await getFirebaseUser(req);
    if (!firebaseUser) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const user = await prisma.users.findUnique({ where: { firebase_user_id: firebaseUser.uid } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { playlistId, trackId } = body;

    if (!playlistId || !trackId) return NextResponse.json({ error: "playlistId and trackId are required" }, { status: 400 });

    // Verify playlist belongs to user
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist || playlist.userId !== user.id) return NextResponse.json({ error: "Playlist not found or unauthorized" }, { status: 403 });

    // Prevent duplicates
    const existingTrack = await prisma.playlistTrack.findUnique({
      where: { playlistId_trackId: { playlistId, trackId } }, // assumes composite unique key
    });
    if (existingTrack) return NextResponse.json({ error: "Track already exists in the playlist" }, { status: 409 });

    const playlistTrack = await prisma.playlistTrack.create({ data: { playlistId, trackId } });
    return NextResponse.json(playlistTrack, { status: 201 });
  } catch (err) {
    console.error("Error adding track to playlist:", err);
    return NextResponse.json({ error: "Failed to add track" }, { status: 500 });
  }
}

// ------------------- DELETE tracks from playlist -------------------
export async function DELETE(req: NextRequest) {
  try {
    const firebaseUser = await getFirebaseUser(req);
    if (!firebaseUser) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const user = await prisma.users.findUnique({ where: { firebase_user_id: firebaseUser.uid } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { playlistId, trackIds } = body;

    if (!playlistId || !trackIds || !trackIds.length) return NextResponse.json({ error: "Missing playlistId or trackIds" }, { status: 400 });

    // Verify playlist belongs to user
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist || playlist.userId !== user.id) return NextResponse.json({ error: "Unauthorized or playlist not found" }, { status: 403 });

    await prisma.playlistTrack.deleteMany({ where: { playlistId, trackId: { in: trackIds } } });

    return NextResponse.json({ message: "Tracks removed successfully" }, { status: 200 });
  } catch (err) {
    console.error("Error deleting playlist tracks:", err);
    return NextResponse.json({ error: "Failed to delete playlist tracks" }, { status: 500 });
  }
}

// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const id = Number(searchParams.get("id"));
//     if (!id) {
//       return NextResponse.json(
//         { error: "Playlist ID is required" },
//         { status: 400 }
//       );
//     }
//     // Find all tracks from PlaylistTrack linked to the given playlist
//     const playlistTracks = await prisma.playlistTrack.findMany({
//       where: { playlistId: id },
//       include: {
//         track: {
//           include: {
//             artist: true, // include artist info if needed
//           },
//         },
//       },
//     });
//     if (!playlistTracks.length) {
//       return NextResponse.json(
//         { error: "No tracks found for this playlist" },
//         { status: 404 }
//       );
//     }
//     // Extract only the backing track data
//     const backingTracks = playlistTracks.map((pt) => pt.track);
//     return NextResponse.json(backingTracks, { status: 200 });
//   } catch (err) {
//     console.error("Error fetching playlist backing tracks:", err);
//     return NextResponse.json(
//       { error: "Error fetching playlist tracks" },
//       { status: 500 }
//     );
//   }
// }
// export async function POST(req: NextRequest) {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//     }

//     const user = await prisma.users.findUnique({
//       where: { clerk_user_id: userId },
//     });

//     if (!user) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }

//     const body = await req.json();
//     const { playlistId, trackId } = body;

//     if (!playlistId || !trackId) {
//       return NextResponse.json({ error: "playlistId and trackId are required" }, { status: 400 });
//     }

//     // Check if playlist belongs to user
//     const playlist = await prisma.playlist.findUnique({
//       where: { id: playlistId },
//     });
//     if (!playlist || playlist.userId !== user.id) {
//       return NextResponse.json({ error: "Playlist not found or unauthorized" }, { status: 403 });
//     }

//     // Check if track already exists in the playlist
//     const existingTrack = await prisma.playlistTrack.findUnique({
//       where: {
//         playlistId_trackId: { playlistId, trackId }, // assumes composite unique key
//       },
//     });

//     if (existingTrack) {
//       return NextResponse.json({ error: "Track already exists in the playlist" }, { status: 409 });
//     }

//     // Add track to PlaylistTrack
//     const playlistTrack = await prisma.playlistTrack.create({
//       data: {
//         playlistId,
//         trackId,
//       },
//     });

//     return NextResponse.json(playlistTrack, { status: 201 });

//   } catch (err) {
//     console.error("Error adding track to playlist:", err);
//     return NextResponse.json({ error: "Failed to add track" }, { status: 500 });
//   }
// }
// export async function DELETE(req: NextRequest) {
//   try {
//     const { trackIds, playlistId } = await req.json();

//     if (!playlistId || !trackIds || !trackIds.length) {
//       return NextResponse.json({ error: "Missing playlistId or trackIds" }, { status: 400 });
//     }

//     await prisma.playlistTrack.deleteMany({
//       where: {
//         playlistId,
//         trackId: { in: trackIds },
//       },
//     });

//     return NextResponse.json({ message: "Tracks removed successfully" }, { status: 200 });
//   } catch (err) {
//     console.error("Error deleting playlist tracks:", err);
//     return NextResponse.json({ error: "Failed to delete playlist tracks" }, { status: 500 });
//   }
// }