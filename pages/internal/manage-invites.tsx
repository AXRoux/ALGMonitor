import React, { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export default function ManageInvitesPage() {
  // @ts-ignore
  const myRole = useQuery(api.userRoles.getMyRole, {});
  // @ts-ignore
  const invites = useQuery(
    api.invites.listInvites,
    myRole?.role === "admin" ? {} : "skip",
  );
  // @ts-ignore
  const createInvite = useAction(api.invitesActions.createInvite);
  // @ts-ignore
  const revokeInvite = useMutation(api.invites.revokeInvite);

  const [role, setRole] = useState<'admin' | 'fisher'>("fisher");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    try {
      setCreating(true);
      const t = await createInvite({ role, email });
      setToken(t as string);
    } catch (e: any) {
      setError(e?.message ?? "Failed");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (tok: string) => {
    await revokeInvite({ token: tok });
  };

  return (
    <>
      <SignedOut>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <SignInButton mode="modal">
            <button className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded">Sign In</button>
          </SignInButton>
        </div>
      </SignedOut>
      <SignedIn>
        <div className="space-y-8">
          <h1 className="text-2xl font-bold text-slate-800">Invite Management</h1>

          {myRole?.role !== "admin" && (
            <p className="text-red-600">You are not authorised to view this page.</p>
          )}

          {/* create */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-700">Generate Invite</h2>
            <div className="flex items-center gap-4">
              <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="user@example.com" className="rounded border-slate-300 focus:ring-sky-500 focus:border-sky-500 px-2 py-1" />
              <select value={role} onChange={(e)=>setRole(e.target.value as 'admin' | 'fisher')} className="rounded border-slate-300 focus:ring-sky-500 focus:border-sky-500">
                <option value="fisher">fisher</option>
                <option value="admin">admin</option>
              </select>
              <button onClick={handleCreate} disabled={creating} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded disabled:opacity-50">Create</button>
            </div>
            {token && (
              <p className="text-sm mt-2 break-all">Invite link: <code>{`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${token}`}</code></p>
            )}
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>

          {/* list */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-slate-700">Active Invites</h2>
            {invites?.length ? (
              <ul className="divide-y divide-slate-200 text-sm">
                {invites.map((i: any)=> (
                  <li key={i._id} className="py-2 flex justify-between items-center">
                    <span>{i.role} – {i.email}</span>
                    <span className="text-xs text-slate-500 break-all">{i.token}</span>
                    <button onClick={()=>handleRevoke(i.token)} className="text-red-600 hover:underline">Revoke</button>
                  </li>
                ))}
              </ul>
            ) : <p className="text-slate-500 text-sm">No active invites.</p>}
          </div>
        </div>
      </SignedIn>
    </>
  );
} 