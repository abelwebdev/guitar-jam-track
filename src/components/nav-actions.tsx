"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function NavActions() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 text-sm">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>
    </div>
  )
}