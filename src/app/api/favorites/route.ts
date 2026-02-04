import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adminAuth } from '@/lib/firebaseAdmin';

// Helper to get Firebase user from request
async function getFirebaseUser(req: NextRequest) {
  try {
    // Read token from cookie named "jam-track-session"
    const sessionCookie = req.cookies.get("jam-track-session")?.value;

    if (!sessionCookie) {
      return null; // no token found
    }

    // Verify the token with Firebase Admin
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true); 
    return decoded; // contains uid, email, etc.
  } catch (err) {
    console.error("Failed to verify Firebase session cookie:", err);
    return null;
  }
}

// GET /api/favorites - Get user's favorite tracks
export async function GET(request: NextRequest) {
  try {
    const firebaseUser = await getFirebaseUser(request);
    if (!firebaseUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find user by firebase_user_id
    const user = await prisma.users.findUnique({
      where: { firebase_user_id: firebaseUser.uid }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's favorite tracks
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        track: {
          include: {
            artist: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform the data to match the expected format
    const favoriteTracks = favorites.map(favorite => ({
      id: favorite.track.id,
      track_title: favorite.track.track_title,
      track_url: favorite.track.track_url,
      artist_id: favorite.track.artist_id,
      artist: favorite.track.artist,
      favoriteId: favorite.id,
      favoritedAt: favorite.createdAt
    }));

    return NextResponse.json(favoriteTracks);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/favorites - Add track to favorites
export async function POST(request: NextRequest) {
  try {
    const firebaseUser = await getFirebaseUser(request);
    if (!firebaseUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { trackId } = await request.json();

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 });
    }

    // Find user by firebase_user_id
    const user = await prisma.users.findUnique({
      where: { firebase_user_id: firebaseUser.uid }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if track exists
    const track = await prisma.backingTrack.findUnique({
      where: { id: parseInt(trackId) }
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Add to favorites (will fail if already exists due to unique constraint)
    try {
      const favorite = await prisma.favorite.create({
        data: {
          userId: user.id,
          trackId: parseInt(trackId)
        },
        include: {
          track: {
            include: {
              artist: true
            }
          }
        }
      });

      return NextResponse.json({
        id: favorite.id,
        message: 'Track added to favorites',
        track: {
          id: favorite.track.id,
          track_title: favorite.track.track_title,
          track_url: favorite.track.track_url,
          artist_id: favorite.track.artist_id,
          artist: favorite.track.artist
        }
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Track already in favorites' }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/favorites - Remove track from favorites
export async function DELETE(request: NextRequest) {
  try {
    const firebaseUser = await getFirebaseUser(request);
    if (!firebaseUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { trackId } = await request.json();

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 });
    }

    // Find user by firebase_user_id
    const user = await prisma.users.findUnique({
      where: { firebase_user_id: firebaseUser.uid }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove from favorites
    const deletedFavorite = await prisma.favorite.deleteMany({
      where: {
        userId: user.id,
        trackId: parseInt(trackId)
      }
    });

    if (deletedFavorite.count === 0) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Track removed from favorites' });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}