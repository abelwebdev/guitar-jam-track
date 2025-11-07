"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Music4,
  MicVocal,
  UserRound,
  LogOut,
} from "lucide-react"
import { RiPlayListFill } from "react-icons/ri"
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Sidebar,
  SidebarHeader,
  SidebarRail,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { NavActions } from "@/components/nav-actions"
import { Separator } from "@/components/ui/separator"
import { Toaster } from "sonner"
import Image from "next/image"
import { signOut } from "firebase/auth";
import { useState, useEffect } from "react"
import { useGetUserQuery, useSessionLogoutMutation } from "@/services/api"
import { auth } from "@/lib/firebaseClient"
import { onAuthStateChanged, getIdToken } from "firebase/auth"
import { useRouter } from "next/navigation";

const data = {
  navMain: [
    {
      title: "Home",
      url: "/home",
      icon: Home,
    },
    {
      title: "Backing Tracks",
      url: "/home/tracks",
      icon: Music4,
    },
    {
      title: "Artists",
      url: "/home/artists",
      icon: MicVocal,
    },
    {
      title: "Playlist",
      url: "/home/playlist",
      icon: RiPlayListFill,
    },
    {
      title: "Profile",
      url: "/home/profile",
      icon: UserRound,
    },
  ],
}

export default function HomeLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [idToken, setIdToken] = useState<string | null>(null);
  const { data: user, isLoading: userLoading, error: userError } = useGetUserQuery(idToken!, {
    skip: !idToken,
  });
  const [logout, { isLoading }] = useSessionLogoutMutation();
  const pathname = usePathname()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await getIdToken(user, true);
        setIdToken(token);
      } else {
        setIdToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <SidebarProvider>
      <Toaster
        position="top-center"
        richColors
      />
      <Sidebar className="border-r-0">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="w-fit">
                    <div className="flex items-center gap-2">
                      <Image
                        src={"/guitar-jam-track.png"}
                        alt="logo"
                        width={35}
                        height={35}
                        className="dark:invert"
                      />
                    </div>
                    <span className="truncate font-bold">Guitar JamTrack</span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
          {/* Main navigation */}
          <SidebarMenu className="mt-4">
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={pathname === item.url}>
                  <Link href={item.url}>
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {/* Logout Button */}
            <SidebarMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <SidebarMenuButton asChild>
                    <button className="flex items-center w-full">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </SidebarMenuButton>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to logout? You will need to sign in again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          await logout().unwrap();
                          await signOut(auth);
                          router.push("/");
                        } catch (err) {
                          console.error("Logout failed:", err);
                        }
                      }}
                    >
                      Logout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarRail />
      </Sidebar>
      {/* ---- Main Content Area ---- */}
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        {/* Fixed Header */}
        <header className="flex h-14 shrink-0 items-center gap-2 bg-background z-10 shadow-sm">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
          </div>
          <div className="ml-auto px-3">
            <div className="flex gap-3">
              <NavActions />
            </div>
          </div>
        </header>
        {/* Scrollable Main */}
        <main className="flex-1 overflow-y-auto px-4 pt-5">
          {children}
          {/* Space reserved for player at bottom */}
          <div className="h-32 sm:h-32" />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}