# 🎸 Guitar JamTrack

Welcome to **Guitar JamTrack** – a modern Next.js application designed for guitarists to discover, practice, and master their craft with professional backing tracks. Guitar JamTrack provides an intuitive platform to explore thousands of tracks, organize practice sessions, and utilize essential guitar tools.

## ✨ Features

### 🎵 Core Features
- **Extensive Track Library** – Explore a large collection of guitar backing tracks 
- **Artist Discovery** – Explore featured artists and their complete track collections
- **Smart Playlists** – Create and organize custom practice routines
- **Favorites System** – Quick access to your most-loved backing tracks
- **Advanced Audio Player** – Full-featured player with loop points, speed control (0.25x-2x), and download capability

### 🎸 Practice Tools
- **Metronome** – Adjustable BPM (40-240), multiple time signatures, and sound types
- **Chromatic Tuner** – Real-time pitch detection with visual feedback
- **Chord Library** – Interactive chord diagrams with multiple positions
- **Scale Explorer** – Visual fretboard with scale patterns and root note highlighting

### 💻 Tech Stack
- **Next.js 15** with App Router and TypeScript
- **PostgreSQL** database with Prisma ORM
- **Firebase Authentication** for secure user management
- **Tailwind CSS** + Shadcn/ui for modern, responsive design
- **RTK Query** for efficient data fetching and caching
- **Web Audio API** for audio processing and practice tools

## 🛠️ Tech Stack Details

### Frontend
- **Framework:** [Next.js 15](https://nextjs.org) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org)
- **Styling:** [Tailwind CSS](https://tailwindcss.com)
- **UI Components:** [Shadcn/ui](https://ui.shadcn.com)
- **Icons:** [Lucide React](https://lucide.dev)

### Backend & Data
- **Database:** [PostgreSQL](https://www.postgresql.org)
- **ORM:** [Prisma](https://www.prisma.io)
- **API:** [RTK Query](https://redux-toolkit.js.org/rtk-query/overview) (Redux Toolkit)
- **State Management:** React Context API + RTK Query

### Authentication & Services
- **Authentication:** [Firebase Auth](https://firebase.google.com/products/auth)
- **External APIs:** [TheAudioDB](https://www.theaudiodb.com) (Artist images and Bio)

### Audio & Music
- **Chord Library:** [@tombatossals/react-chords](https://www.npmjs.com/package/@tombatossals/react-chords)
- **Audio Processing:** Web Audio API (Native browser API)

## 🚀 Getting Started

Follow the steps below to set up Guitar JamTrack on your local machine.

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [PostgreSQL](https://www.postgresql.org/) v14 or higher
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/abelwebdev/guitar-jam-track.git
    cd guitar-jam-track
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Set up environment variables:**

    Create a `.env` file in the project root and add your configuration:

    ```env
    # Backend API URL
    NEXT_PUBLIC_API_URL="http://localhost:3000/api"
    
    # Database
    DATABASE_URL="postgresql://username:password@localhost:5432/jamtrack?schema=public"
    
    # Firebase Configuration
    NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
    NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
    FIREBASE_ADMIN_PROJECT_ID=guitar-jamtrack
    FIREBASE_ADMIN_CLIENT_EMAIL=your-admin-client-email
    FIREBASE_ADMIN_PRIVATE_KEY=your-admin-private-key
    ```

4. **Set up the database:**

    ```bash
    # Generate Prisma Client
    npx prisma generate
    
    # Run database migrations
    npx prisma migrate dev
    ```

5. **Run the development server:**

    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action.

## 🎯 Key Features Explained

### Audio Player
The advanced audio player includes:
- A-B loop points for practicing specific sections
- Playback speed control (0.25x to 2x)
- Volume control
- Track download functionality
- Keyboard shortcuts (Space to play/pause, Esc to close)

### Practice Tools
All tools are built using native Web APIs:
- **Metronome**: Uses Web Audio API for precise timing
- **Tuner**: Real-time pitch detection using FFT analysis
- **Chord Library**: Interactive SVG-based chord diagrams
- **Scale Explorer**: Visual fretboard with highlighted scale patterns

## 🙏 Acknowledgments

- Backing track data from [Guitar Backing Track](https://guitarbackingtrack.org)
- Artist images and Bio from [TheAudioDB](https://www.theaudiodb.com)