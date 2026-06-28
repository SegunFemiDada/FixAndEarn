// Path: apps/web/src/app/admin/admins/page.tsx
"use client";

import * as React from "react";
import { extractApiErrorMessage, useAdminMe } from "@/lib/admin/queries";
import {
  useAdminAdminsList,
  useCreateAdmin,
  useDeactivateAdmin,
  useReactivateAdmin,
  useRotateAdminTotp,
} from "@/lib/admin/admins/queries";
import type { AdminRole } from "@/lib/admin/types";
import type { AdminListItem } from "@/lib/admin/admins/types";

const ROLE_OPTIONS: Array<{ value: AdminRole; label: string }> = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "VERIFICATION_OFFICER", label: "Verification Officer" },
  { value: "FINANCE_OFFICER", label: "Finance Officer" },
  { value: "SUPPORT_OFFICER", label: "Support Officer" },
  { value: "SECURITY_OFFICER", label: "Security Officer" },
];

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-3 py-2 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function AdminRow({
  admin,
  currentAdminId,
  onActionMessage,
  onRotateSuccess,
}: {
  admin: AdminListItem;
  currentAdminId: string | null | undefined;
  onActionMessage: (message: { type: "ok" | "err"; text: string } | null) => void;
  onRotateSuccess: (payload: { fullName: string; totpSecret: string; totpProvisioningUri: string }) => void;
}) {
  const [reason, setReason] = React.useState("");

  const deactivateMutation = useDeactivateAdmin(admin.id);
  const reactivateMutation = useReactivateAdmin(admin.id);
  const rotateMutation = useRotateAdminTotp(admin.id);

  const busy =
    deactivateMutation.isPending ||
    reactivateMutation.isPending ||
    rotateMutation.isPending;

  const isSelf = currentAdminId === admin.id;

  function handleDeactivate() {
    const confirmed = window.confirm(`Deactivate ${admin.fullName}?`);
    if (!confirmed) return;

    onActionMessage(null);

    deactivateMutation.mutate(
      { reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          onActionMessage({ type: "ok", text: `${admin.fullName} was deactivated.` });
        },
        onError: (error) => {
          onActionMessage({ type: "err", text: extractApiErrorMessage(error) });
        },
      }
    );
  }

  function handleReactivate() {
    const confirmed = window.confirm(`Reactivate ${admin.fullName}?`);
    if (!confirmed) return;

    onActionMessage(null);

    reactivateMutation.mutate(
      { reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          onActionMessage({ type: "ok", text: `${admin.fullName} was reactivated.` });
        },
        onError: (error) => {
          onActionMessage({ type: "err", text: extractApiErrorMessage(error) });
        },
      }
    );
  }

  function handleRotateTotp() {
    const confirmed = window.confirm(`Rotate TOTP for ${admin.fullName}?`);
    if (!confirmed) return;

    onActionMessage(null);

    rotateMutation.mutate(
      { reason: reason.trim() || undefined },
      {
        onSuccess: (response) => {
          onActionMessage({ type: "ok", text: `TOTP rotated for ${admin.fullName}.` });
          onRotateSuccess({
            fullName: admin.fullName,
            totpSecret: response.totpSecret,
            totpProvisioningUri: response.totpProvisioningUri,
          });
        },
        onError: (error) => {
          onActionMessage({ type: "err", text: extractApiErrorMessage(error) });
        },
      }
    );
  }

  return (
    <article className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{admin.fullName}</h4>

            <span
              className={[
                "rounded-full px-3 py-1 text-xs font-medium",
                admin.isActive
                  ? "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
                  : "border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300",
              ].join(" ")}
            >
              {admin.isActive ? "Active" : "Inactive"}
            </span>

            <span
              className={[
                "rounded-full px-3 py-1 text-xs font-medium",
                admin.is2faEnabled
                  ? "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
                  : "border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300",
              ].join(" ")}
            >
              {admin.is2faEnabled ? "2FA enabled" : "2FA disabled"}
            </span>

            {isSelf && (
              <span className="rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-blue-900/20 px-3 py-1 text-xs font-medium text-[#5B8FCC] dark:text-[#7AAEE0]">
                Current admin
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">{admin.email}</p>

          <div className="mt-3 grid gap-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Admin ID
              </span>
              <span className="mt-1 block break-all">{admin.id}</span>
            </div>

            <div>
              <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Role
              </span>
              <span className="mt-1 block">{admin.role}</span>
            </div>

            <div>
              <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Created
              </span>
              <span className="mt-1 block">{formatDateTime(admin.createdAt)}</span>
            </div>

            <div>
              <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Updated
              </span>
              <span className="mt-1 block">{formatDateTime(admin.updatedAt)}</span>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4">
            <label htmlFor={`admin-reason-${admin.id}`} className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
              Action reason
            </label>
            <textarea
              id={`admin-reason-${admin.id}`}
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Optional reason for deactivate, reactivate, or TOTP rotation."
              disabled={busy}
              className="mt-2 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-56">
          <button
  type="button"
  onClick={handleDeactivate}
  disabled={!admin.isActive || busy || isSelf}
  className="
    inline-flex items-center justify-center rounded-lg px-4 py-3 font-semibold
    bg-red-600 text-white
    hover:bg-red-700 focus:ring-2 focus:ring-red-400
    transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
    dark:bg-red-500 dark:text-white
    dark:hover:bg-red-600 dark:focus:ring-red-300
  "
>
  {deactivateMutation.isPending ? "Deactivating..." : "Deactivate"}
</button>

<button
  type="button"
  onClick={handleReactivate}
  disabled={admin.isActive || busy}
  className="
    inline-flex items-center justify-center rounded-lg px-4 py-3 font-semibold
    bg-green-600 text-white
    hover:bg-green-700 focus:ring-2 focus:ring-green-400
    transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
    dark:bg-green-500 dark:text-white
    dark:hover:bg-green-600 dark:focus:ring-green-300
  "
>
  {reactivateMutation.isPending ? "Reactivating..." : "Reactivate"}
</button>

<button
  type="button"
  onClick={handleRotateTotp}
  disabled={busy}
  className="
    inline-flex items-center justify-center rounded-lg px-4 py-3 font-semibold
    bg-gray-200 text-gray-700
    hover:bg-gray-300 focus:ring-2 focus:ring-gray-400
    transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
    dark:bg-gray-700 dark:text-gray-200
    dark:hover:bg-gray-600 dark:focus:ring-gray-500
  "
>
  {rotateMutation.isPending ? "Rotating..." : "Rotate TOTP"}
</button>

        </div>
      </div>
    </article>
  );
}

export default function AdminManagementPage() {
  const meQuery = useAdminMe(true);
  const listQuery = useAdminAdminsList(true);
  const createMutation = useCreateAdmin();

  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<AdminRole>("SUPPORT_OFFICER");
  const [message, setMessage] = React.useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [latestTotpSetup, setLatestTotpSetup] = React.useState<{
    fullName: string;
    totpSecret: string;
    totpProvisioningUri: string;
  } | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    createMutation.mutate(
      {
        email: email.trim(),
        fullName: fullName.trim(),
        password,
        role,
      },
      {
        onSuccess: (response) => {
          setMessage({ type: "ok", text: "Admin created successfully." });
          setLatestTotpSetup({
            fullName: response.admin.fullName,
            totpSecret: response.totpSecret,
            totpProvisioningUri: response.totpProvisioningUri,
          });
          setEmail("");
          setFullName("");
          setPassword("");
          setRole("SUPPORT_OFFICER");
        },
        onError: (error) => {
          setMessage({ type: "err", text: extractApiErrorMessage(error) });
        },
      }
    );
  }

  const admins = listQuery.data ?? [];
  const currentAdminId = meQuery.data?.admin?.id ?? null;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">Admins</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Admin management</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Create additional admin accounts, deactivate or reactivate admins, and rotate TOTP secrets safely.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Create admin</h3>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="admin-full-name" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                Full name
              </label>
              <input
                id="admin-full-name"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                disabled={createMutation.isPending}
              />
            </div>

            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                disabled={createMutation.isPending}
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                Temporary password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                placeholder="Minimum 10 characters"
                disabled={createMutation.isPending}
              />
            </div>

            <div>
              <label htmlFor="admin-role" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                Role
              </label>
              <select
                id="admin-role"
                value={role}
                onChange={(event) => setRole(event.target.value as AdminRole)}
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                disabled={createMutation.isPending}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {message && (
              <div
                className={[
                  "rounded-2xl border p-3 text-sm",
                  message.type === "ok"
                    ? "border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
                    : "border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300",
                ].join(" ")}
              >
                {message.text}
              </div>
            )}

            <button
  type="submit"
  disabled={createMutation.isPending}
  className="
    inline-flex items-center justify-center
    rounded-lg px-4 py-3 font-semibold
    bg-blue-600 text-white
    hover:bg-blue-700 focus:ring-2 focus:ring-blue-400
    transition-colors shadow-md
    disabled:opacity-50 disabled:cursor-not-allowed
    dark:bg-blue-500 dark:text-white
    dark:hover:bg-blue-600 dark:focus:ring-blue-300
  "
>
  {createMutation.isPending ? "Creating..." : "Create admin"}
</button>

          </form>
        </div>

        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Latest TOTP setup</h3>
          <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Save these details immediately after admin creation or TOTP rotation.
          </p>

          {!latestTotpSetup ? (
            <div className="mt-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              No TOTP setup data yet.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Admin</div>
                <div className="mt-2 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {latestTotpSetup.fullName}
                </div>
              </div>

              <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">TOTP secret</div>
                <div className="mt-2 break-all text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {latestTotpSetup.totpSecret}
                </div>
                <div className="mt-3">
                  <CopyButton value={latestTotpSetup.totpSecret} />
                </div>
              </div>

              <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Provisioning URI</div>
                <div className="mt-2 break-all text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {latestTotpSetup.totpProvisioningUri}
                </div>
                <div className="mt-3">
                  <CopyButton value={latestTotpSetup.totpProvisioningUri} />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Existing admins</h3>

        {listQuery.isLoading ? (
          <div className="mt-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Loading admins...</div>
        ) : listQuery.isError ? (
          <div className="mt-4 rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300">
            {extractApiErrorMessage(listQuery.error)}
          </div>
        ) : admins.length === 0 ? (
          <div className="mt-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No admin accounts found.</div>
        ) : (
          <div className="mt-4 grid gap-4">
            {admins.map((admin) => (
              <AdminRow
                key={admin.id}
                admin={admin}
                currentAdminId={currentAdminId}
                onActionMessage={setMessage}
                onRotateSuccess={setLatestTotpSetup}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}