import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";

// Tailwind-based secret admin page for role management.
// Route: /internal/manage-roles (not linked anywhere in the UI)

export default function ManageRolesPage() {
  // Clerk user info (for optional display)
  const { isLoaded, user } = useUser();

  // Queries & hooks
  // Type generation for new Convex functions happens after a dev/build restart.
  // While editing, silence TypeScript until those are available.
  // @ts-ignore
  const myRole = useQuery(api.userRoles.getMyRole, {});
  // Conditionally load all roles only if current user is admin using Convex "skip" pattern.
  // @ts-ignore
  const roles = useQuery(
    api.userRoles.listAllRoles,
    myRole?.role === "admin" ? {} : "skip",
  );

  // @ts-ignore
  const assignRole = useMutation(api.userRoles.assignRoleByAdmin);
  // @ts-ignore
  const fetchClerkUsers = useAction(api.userRoles.fetchClerkUsers);

  // Clerk users list pulled by action (only for admins)
  const [clerkUsers, setClerkUsers] = useState<{ id: string; email: string }[] | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local state for assigning role
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("fisher");
  const [assigning, setAssigning] = useState(false);

  // Fetch all Clerk users when the viewer is admin
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        // @ts-ignore
        const users = await fetchClerkUsers({});
        setClerkUsers(users as any);
      } catch (e: any) {
        setError(e?.message ?? "Failed to fetch Clerk users");
      } finally {
        setLoadingUsers(false);
      }
    };

    if (myRole?.role === "admin") {
      loadUsers();
    }
  }, [myRole?.role, fetchClerkUsers]);

  // Assign role to selected user
  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    try {
      setAssigning(true);
      await assignRole({ clerkUserId: selectedUserId, role: selectedRole as any });
      setSelectedUserId("");
      // Refresh roles list automatically due to Convex reactivity
    } catch (e: any) {
      setError(e?.message ?? "Failed to assign role");
    } finally {
      setAssigning(false);
    }
  };

  // Render helpers
  const renderNotSignedIn = () => (
    <div className="bg-white rounded-lg shadow p-6 text-center">
      <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
      <SignInButton mode="modal">
        <button className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded">Sign In</button>
      </SignInButton>
    </div>
  );

  const renderNotAuthorised = () => (
    <div className="bg-white rounded-lg shadow p-6 text-center">
      <h2 className="text-xl font-semibold mb-4">Not Authorised</h2>
      <p className="text-slate-600 text-sm">You do not have permission to view this page.</p>
    </div>
  );

  const renderAdminUI = () => (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-slate-800">Role Management</h1>

      {/* Assign role form */}
      <form onSubmit={handleAssignRole} className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-700">Assign / Update Role</h2>
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="grid md:grid-cols-3 gap-4">
          <div className="col-span-2 space-y-2">
            <label htmlFor="user" className="block text-sm font-medium text-slate-600">User</label>
            <select
              id="user"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="w-full rounded border-slate-300 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="">Select a user</option>
              {clerkUsers?.map((u) => (
                <option key={u.id} value={u.id}>{u.email || u.id}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="role" className="block text-sm font-medium text-slate-600">Role</label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full rounded border-slate-300 focus:ring-sky-500 focus:border-slate-500"
            >
              <option value="fisher">fisher</option>
              <option value="admin">admin</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={assigning || !selectedUserId}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded disabled:opacity-50"
          aria-busy={assigning}
        >
          Assign Role
        </button>
      </form>

      {/* Existing roles table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Existing Roles</h2>
        {roles?.length ? (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="py-2 pr-4">Clerk User ID</th>
                <th className="py-2 pr-4">Role</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r: any) => (
                <tr key={r._id} className="border-t border-slate-200">
                  <td className="py-2 pr-4 font-mono text-xs">{r.clerkUserId}</td>
                  <td className="py-2 pr-4">{r.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-slate-500 text-sm">No roles found.</p>
        )}
      </div>
    </div>
  );

  // Main render logic
  return (
    <>
      <SignedOut>{renderNotSignedIn()}</SignedOut>
      <SignedIn>
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {!isLoaded || myRole === undefined ? (
            <p>Loading…</p>
          ) : myRole === null ? (
            renderNotAuthorised()
          ) : myRole.role !== "admin" ? (
            renderNotAuthorised()
          ) : (
            renderAdminUI()
          )}
        </div>
      </SignedIn>
    </>
  );
} 