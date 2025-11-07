# 🎸 Guitar JamTrack

Welcome to **Guitar JamTrack** – a Next.js application built for browsing and enjoying backing tracks. Guitar JamTrack makes it easy to discover tracks, artists, and **create** personalized playlists.  

## ✨ Features

- **User Authentication** – Secure, hassle-free login and signup powered by [Firebase](https://firebase.google.com).  
- **Backing Tracks** – Explore a wide collection of backing tracks.  
- **Artists** – Browse and discover your favorite artists.  
- **Playlists** – Save your favorite tracks and organize them into playlists.  

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org)  
- **Language:** [TypeScript](https://www.typescriptlang.org)  
- **Database:** [PostgreSQL](https://www.postgresql.org)
- **ORM:** [Prisma](https://www.prisma.io)
- **Authentication:** [Firebase](https://firebase.google.com)  
- **Styling:** [Tailwind CSS](https://tailwindcss.com) + [Shadcn](https://ui.shadcn.com)  

## 🚀 Getting Started

Follow the steps below to set up Guitar JamTrack on your local machine.  

### Prerequisites

Ensure you have the following installed:  

- [Node.js](https://nodejs.org/) v22.15.0 or higher  

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

    Create a `.env` file in the project root and add your firebase credentials and other configuration:  

    ```env
    BACKEND_URL="http://localhost:3000"
    DATABASE_URL="postgresql://username:password@localhost:5432/jamtrack?schema=public"
    ```

4. **Run the development server:**

    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action.
