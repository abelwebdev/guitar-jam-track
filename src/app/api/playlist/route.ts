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
// ------------------- GET -------------------
export async function GET(req: NextRequest) {
  try {
    const firebaseUser = await getFirebaseUser(req);
    if (!firebaseUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const user = await prisma.users.findUnique({
      where: { firebase_user_id: firebaseUser.uid },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const playlists = await prisma.playlist.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { playlistTracks: true } } },
    });
    const result = playlists.map((p) => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      trackCount: p._count.playlistTracks,
    }));
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 });
  }
}
// ------------------- POST -------------------
export async function POST(req: NextRequest) {
  try {
    const firebaseUser = await getFirebaseUser(req);
    if (!firebaseUser) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const user = await prisma.users.findUnique({
      where: { firebase_user_id: firebaseUser.uid },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const body = await req.json();
    const { name } = body;
    if (!name || !name.trim()) return NextResponse.json({ error: "Playlist name is required" }, { status: 400 });
    const playlist = await prisma.playlist.create({
      data: { name: name.trim(), userId: user.id },
    });
    return NextResponse.json(playlist, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 });
  }
}
// ------------------- PATCH -------------------
export async function PATCH(req: NextRequest) {
  try {
    const firebaseUser = await getFirebaseUser(req);
    if (!firebaseUser) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const user = await prisma.users.findUnique({
      where: { firebase_user_id: firebaseUser.uid },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const body = await req.json();
    const { id, name, removeTracks }: { id: number; name?: string; removeTracks?: number[] } = body;
    if (!id) return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 });
    const playlist = await prisma.playlist.findUnique({ where: { id } });
    if (!playlist || playlist.userId !== user.id) return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    // Delete tracks if requested
    if (removeTracks && removeTracks.length > 0) {
      await prisma.playlistTrack.deleteMany({
        where: { playlistId: id, trackId: { in: removeTracks } },
      });
    }
    // Update playlist name
    const data: { name?: string } = {};
    if (name && name.trim()) data.name = name.trim();
    const updatedPlaylist = await prisma.playlist.update({ where: { id }, data });
    return NextResponse.json(updatedPlaylist);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update playlist" }, { status: 500 });
  }
}
// ------------------- DELETE -------------------
export async function DELETE(req: NextRequest) {
  try {
    const firebaseUser = await getFirebaseUser(req);
    if (!firebaseUser) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const user = await prisma.users.findUnique({
      where: { firebase_user_id: firebaseUser.uid },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "");
    if (!id) return NextResponse.json({ error: "Playlist ID required" }, { status: 400 });
    const playlist = await prisma.playlist.findUnique({ where: { id } });
    if (!playlist || playlist.userId !== user.id) return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    await prisma.playlist.delete({ where: { id } });
    return NextResponse.json({ message: "Playlist deleted successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete playlist" }, { status: 500 });
  }
}


// export async function GET() {
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
//     const playlists = await prisma.playlist.findMany({
//       where: { userId: user.id },
//       orderBy: { createdAt: "desc" },
//       include: {
//         _count: {
//           select: { playlistTracks: true }, // count number of tracks
//         },
//       },
//     });
//     // Transform to include trackCount
//     const result = playlists.map((p) => ({
//       id: p.id,
//       name: p.name,
//       createdAt: p.createdAt,
//       trackCount: p._count.playlistTracks,
//     }));

//     return NextResponse.json(result);
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 });
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
//     // Get playlist name from request body
//     const body = await req.json();
//     const { name } = body;

//     if (!name || !name.trim()) {
//       return NextResponse.json({ error: "Playlist name is required" }, { status: 400 });
//     }
//     // Create the playlist
//     const playlist = await prisma.playlist.create({
//       data: {
//         name,
//         userId: user.id,
//       },
//     });
//     return NextResponse.json(playlist, { status: 201 });
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 });
//   }
// }
// export async function PATCH(req: NextRequest) {
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
//     const { id, name, removeTracks }: { id: number; name?: string; removeTracks?: number[] } = body;

//     if (!id) {
//       return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 });
//     }

//     // Check if the playlist exists and belongs to the user
//     const playlist = await prisma.playlist.findUnique({ where: { id } });
//     if (!playlist || playlist.userId !== user.id) {
//       return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
//     }

//     // Update name if provided
//     const data: { name?: string } = {};
//     if (name && name.trim()) {
//       data.name = name.trim();
//     }

//     // Delete tracks if removeTracks array provided
//     if (removeTracks && removeTracks.length > 0) {
//       await prisma.playlistTrack.deleteMany({
//         where: {
//           playlistId: id,
//           trackId: { in: removeTracks },
//         },
//       });
//     }

//     // Update playlist name
//     const updatedPlaylist = await prisma.playlist.update({
//       where: { id },
//       data,
//     });

//     return NextResponse.json(updatedPlaylist);
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ error: "Failed to update playlist" }, { status: 500 });
//   }
// }
// export async function DELETE(req: NextRequest) {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//     }
//     const { searchParams } = new URL(req.url);
//     const id = parseInt(searchParams.get("id") || "");
//     if (!id) {
//       return NextResponse.json({ error: "Playlist ID required" }, { status: 400 });
//     }
//     const user = await prisma.users.findUnique({
//       where: { clerk_user_id: userId },
//     });
//     if (!user) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }
//     const playlist = await prisma.playlist.findUnique({ where: { id } });
//     if (!playlist || playlist.userId !== user.id) {
//       return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
//     }
//     await prisma.playlist.delete({ where: { id } });
//     return NextResponse.json({ message: "Playlist deleted successfully" });
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ error: "Failed to delete playlist" }, { status: 500 });
//   }
// }