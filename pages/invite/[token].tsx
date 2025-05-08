import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";

export default function InvitePage() {
  const router = useRouter();
  const { token } = router.query;
  const redeem = useMutation(api.invites.redeemInvite as any);
  const { user, isLoaded } = useUser();
  const [status, setStatus] = useState<"idle" | "redeeming" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const doRedeem = async () => {
      if (!token || Array.isArray(token)) return;
      if (!isLoaded || !user) return;
      try {
        setStatus("redeeming");
        await redeem({ token });
        setStatus("done");
        setTimeout(()=> router.replace("/"), 1500); // redirect home
      } catch (e: any) {
        setStatus("error");
        setMessage(e?.message ?? "Failed to redeem invite");
      }
    };
    doRedeem();
  }, [token, isLoaded, user]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="bg-white shadow rounded-lg p-8 max-w-md w-full space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Invitation</h1>
        {status === "idle" && (
          <>
            <p className="text-slate-600">Checking invitation…</p>
          </>
        )}
        <SignedOut>
          <p className="text-slate-600">You must sign in or sign up to accept this invite.</p>
          <SignInButton mode="modal">
            <button className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded">Sign In / Sign Up</button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          {status === "redeeming" && <p className="text-slate-600">Redeeming invite…</p>}
          {status === "done" && <p className="text-green-600 font-medium">Invite accepted! Redirecting…</p>}
          {status === "error" && <p className="text-red-600">{message}</p>}
        </SignedIn>
      </div>
    </div>
  );
} 