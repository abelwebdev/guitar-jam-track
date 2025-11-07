"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseClient";
import {
  updatePassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { toast } from "sonner"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDeleteUserMutation } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

export default function Profile() {
  const router = useRouter();
  const user = auth.currentUser;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [email, setEmail] = useState("");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [passwordForDelete, setPasswordForDelete] = useState("");
  const [deleteUserMutation] = useDeleteUserMutation();

  useEffect(() => {
    if (!user) router.push("/sign-in");
    else setEmail(user.email || "");
  }, [user]);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPass) {
      toast.warning("Passwords do not match.")
      return;
    }
    try {
      if (!user) return;
      await updatePassword(user, newPassword);
      toast.success("Password updated successfully!")
      setNewPassword("");
      setConfirmPass("");
    } catch (error: any) {
      toast.error(error.message)
    }
  }
  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const providerId = user.providerData[0].providerId;
    if (providerId === "password") {
      setOpenDeleteDialog(true); //
      return;
    }
    // OAuth / Google user → popup reauth
    try {
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
      await finalizeDeletion();
    } catch (error: any) {
      toast.error(error.message)
    }
  }
  async function handleDeleteConfirmed() {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const credential = EmailAuthProvider.credential(user.email!, passwordForDelete);
      await reauthenticateWithCredential(user, credential);
      await finalizeDeletion();
    } catch (err: any) {
      toast.error(err.message)
    }
  }
  async function finalizeDeletion() {
    const user = auth.currentUser;
    if (!user) return;

    const idToken = await user.getIdToken(true);
    await deleteUserMutation({ idToken }).unwrap();
    await deleteUser(user);

    toast.success("Account deleted successfully.")
    router.push("/sign-in");
  }

  return (
    <div className="max-w-md mx-auto mt-10 space-y-6">
      <h1 className="text-xl font-bold">Profile</h1>
      <p className="text-sm text-gray-500">Logged in as: {email}</p>

      {/* Change Password */}
      <div className="border rounded p-4 space-y-3">
        <h3 className="font-semibold">Change Password</h3>
        <Input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPass}
          onChange={(e) => setConfirmPass(e.target.value)}
        />
        <Button onClick={handleChangePassword}>Update Password</Button>
      </div>

      {/* Delete Account */}
      <div className="border rounded p-4 space-y-3">
        <h3 className="font-semibold text-red-600">Delete Account</h3>
        <Button variant="destructive" onClick={handleDeleteAccount}>
          Delete Account
        </Button>
      </div>

      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Account Deletion</DialogTitle>
            <DialogDescription>
              Enter your password to confirm deletion.
            </DialogDescription>
          </DialogHeader>

          <Input
            type="password"
            placeholder="Password"
            value={passwordForDelete}
            onChange={(e) => setPasswordForDelete(e.target.value)}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirmed}>
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}