"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  loadingText?: string
  variant?: "default" | "destructive"
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loadingText = "Processing...",
  variant = "default",
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-[400px] gap-6 p-6 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/95 backdrop-blur-2xl shadow-2xl">
        <AlertDialogHeader className="gap-2">
          <AlertDialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel
            className="flex-1 rounded-xl border-zinc-200 dark:border-zinc-800 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold uppercase text-[10px] tracking-[0.15em] h-11 transition-all"
            disabled={isLoading}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            className={`flex-1 rounded-xl font-bold uppercase text-[10px] tracking-[0.15em] h-11 transition-all shadow-lg ${variant === "destructive"
              ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
              }`}
            disabled={isLoading}
          >
            {isLoading ? loadingText : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
