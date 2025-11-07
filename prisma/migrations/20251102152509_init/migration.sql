-- CreateTable
CREATE TABLE "Artist" (
    "id" SERIAL NOT NULL,
    "artist_name" TEXT,
    "highlighted" BOOLEAN,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackingTrack" (
    "id" SERIAL NOT NULL,
    "artist_id" INTEGER,
    "track_title" TEXT,
    "track_url" TEXT,

    CONSTRAINT "BackingTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "firebase_user_id" VARCHAR(255),
    "email" VARCHAR(255),
    "img" TEXT,
    "username" VARCHAR(50),
    "first_name" VARCHAR(20),
    "last_name" VARCHAR(20),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Playlist" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "name" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistTrack" (
    "id" SERIAL NOT NULL,
    "playlistId" INTEGER NOT NULL,
    "trackId" INTEGER NOT NULL,

    CONSTRAINT "PlaylistTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Artist_artist_name_key" ON "Artist"("artist_name");

-- CreateIndex
CREATE UNIQUE INDEX "Users_firebase_user_id_key" ON "Users"("firebase_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistTrack_playlistId_trackId_key" ON "PlaylistTrack"("playlistId", "trackId");

-- AddForeignKey
ALTER TABLE "BackingTrack" ADD CONSTRAINT "BackingTrack_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "Artist"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "BackingTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
