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

function getRoleLabel(role: AdminRole) {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center justify-center rounded-lg border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-3 py-2 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA] focus:outline-none focus:ring-2 focus:ring-[#5B8FCC]/30"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function StatusBadge({
  tone,
  children,
}: {
  tone: "success" | "danger" | "info" | "neutral";
  children: React.ReactNode;
}) {
  const classes = {
    success:
      "border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200",
    danger:
      "border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300",
    info:
      "border-[#C5D5EE] dark:border-blue-700 bg-[#EAF0FB] dark:bg-blue-900/20 text-[#5B8FCC] dark:text-[#7AAEE0]",
    neutral:
      "border-[#D7E0ED] dark:border-[#34475F] bg-[#F5F7FA] dark:bg-[#202D3E] text-[#6B7C99] dark:text-[#8FA0BC]",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        classes[tone],
      ].join(" ")}
    >
      {children}
    </span>
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
  onActionMessage: (
    message: { type: "ok" | "err"; text: string } | null
  ) => void;
  onRotateSuccess: (payload: {
    fullName: string;
    totpSecret: string;
    totpProvisioningUri: string;
  }) => void;
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
    const confirmed = window.confirm(
      `Deactivate ${admin.fullName}?`
    );

    if (!confirmed) return;

    onActionMessage(null);

    deactivateMutation.mutate(
      { reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          onActionMessage({
            type: "ok",
            text: `${admin.fullName} was deactivated.`,
          });
          setReason("");
        },
        onError: (error) => {
          onActionMessage({
            type: "err",
            text: extractApiErrorMessage(error),
          });
        },
      }
    );
  }

  function handleReactivate() {
    const confirmed = window.confirm(
      `Reactivate ${admin.fullName}?`
    );

    if (!confirmed) return;

    onActionMessage(null);

    reactivateMutation.mutate(
      { reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          onActionMessage({
            type: "ok",
            text: `${admin.fullName} was reactivated.`,
          });
          setReason("");
        },
        onError: (error) => {
          onActionMessage({
            type: "err",
            text: extractApiErrorMessage(error),
          });
        },
      }
    );
  }

  function handleRotateTotp() {
    const confirmed = window.confirm(
      `Rotate TOTP for ${admin.fullName}?`
    );

    if (!confirmed) return;

    onActionMessage(null);

    rotateMutation.mutate(
      { reason: reason.trim() || undefined },
      {
        onSuccess: (response) => {
          onActionMessage({
            type: "ok",
            text: `TOTP rotated for ${admin.fullName}.`,
          });

          onRotateSuccess({
            fullName: admin.fullName,
            totpSecret: response.totpSecret,
            totpProvisioningUri: response.totpProvisioningUri,
          });

          setReason("");
        },
        onError: (error) => {
          onActionMessage({
            type: "err",
            text: extractApiErrorMessage(error),
          });
        },
      }
    );
  }

  return (
    <tr className="border-t border-[#E1E8F2] dark:border-[#2D3F55]">
      <td className="px-4 py-4 align-top">
        <div className="min-w-[220px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {admin.fullName}
            </span>

            {isSelf && (
              <StatusBadge tone="info">
                Current admin
              </StatusBadge>
            )}
          </div>

          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            {admin.email}
          </p>

          <p className="mt-1 break-all text-xs text-[#9BAEC8] dark:text-[#4A6080]">
            {admin.id}
          </p>
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <StatusBadge tone="neutral">
          {getRoleLabel(admin.role)}
        </StatusBadge>
      </td>

      <td className="px-4 py-4 align-top">
        {admin.isActive ? (
          <StatusBadge tone="success">Active</StatusBadge>
        ) : (
          <StatusBadge tone="danger">Inactive</StatusBadge>
        )}
      </td>

      <td className="px-4 py-4 align-top">
        {admin.is2faEnabled ? (
          <StatusBadge tone="success">Enabled</StatusBadge>
        ) : (
          <StatusBadge tone="danger">Disabled</StatusBadge>
        )}
      </td>

      <td className="px-4 py-4 align-top">
        <div className="whitespace-nowrap text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
          {formatDateTime(admin.createdAt)}
        </div>

        <div className="mt-1 whitespace-nowrap text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
          Updated {formatDateTime(admin.updatedAt)}
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <div className="min-w-[270px]">
          <label
            htmlFor={`admin-reason-${admin.id}`}
            className="sr-only"
          >
            Action reason for {admin.fullName}
          </label>

          <textarea
            id={`admin-reason-${admin.id}`}
            rows={2}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Optional action reason"
            disabled={busy}
            className="w-full resize-none rounded-lg border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-3 py-2 text-xs text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 disabled:cursor-not-allowed disabled:opacity-50"
          />

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={!admin.isActive || busy || isSelf}
              title={
                isSelf
                  ? "You cannot deactivate your own admin account."
                  : undefined
              }
              className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
            >
              {deactivateMutation.isPending
                ? "Deactivating..."
                : "Deactivate"}
            </button>

            <button
              type="button"
              onClick={handleReactivate}
              disabled={admin.isActive || busy}
              className="inline-flex items-center justify-center rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
            >
              {reactivateMutation.isPending
                ? "Reactivating..."
                : "Reactivate"}
            </button>

            <button
              type="button"
              onClick={handleRotateTotp}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-lg border border-[#C5D5EE] dark:border-[#34475F] bg-white dark:bg-[#1E2A3A] px-3 py-2 text-xs font-semibold text-[#1A2B4A] dark:text-[#E8F0FA] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] focus:outline-none focus:ring-2 focus:ring-[#5B8FCC]/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {rotateMutation.isPending
                ? "Rotating..."
                : "Rotate TOTP"}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function AdminManagementPage() {
  const meQuery = useAdminMe(true);
  const listQuery = useAdminAdminsList(true);
  const createMutation = useCreateAdmin();

  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] =
    React.useState<AdminRole>("SUPPORT_OFFICER");

  const [message, setMessage] = React.useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [latestTotpSetup, setLatestTotpSetup] =
    React.useState<{
      fullName: string;
      totpSecret: string;
      totpProvisioningUri: string;
    } | null>(null);

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
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
          setMessage({
            type: "ok",
            text: "Admin created successfully.",
          });

          setLatestTotpSetup({
            fullName: response.admin.fullName,
            totpSecret: response.totpSecret,
            totpProvisioningUri:
              response.totpProvisioningUri,
          });

          setEmail("");
          setFullName("");
          setPassword("");
          setRole("SUPPORT_OFFICER");
        },
        onError: (error) => {
          setMessage({
            type: "err",
            text: extractApiErrorMessage(error),
          });
        },
      }
    );
  }

  const admins = listQuery.data ?? [];
  const currentAdminId = meQuery.data?.admin?.id ?? null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              Administration
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Admin management
            </h2>

            <p className="mt-2 max-w-3xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Manage administrator accounts, access status, roles, and
              TOTP security settings.
            </p>
          </div>

          <StatusBadge tone="info">
            {admins.length} {admins.length === 1 ? "admin" : "admins"}
          </StatusBadge>
        </div>
      </section>

      {/* Create + TOTP */}
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              Account provisioning
            </p>

            <h3 className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Create admin
            </h3>

            <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Create a new administrator account and generate its initial
              TOTP setup details.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-5 grid gap-4 lg:grid-cols-2"
          >
            <div>
              <label
                htmlFor="admin-full-name"
                className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
              >
                Full name
              </label>

              <input
                id="admin-full-name"
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                disabled={createMutation.isPending}
              />
            </div>

            <div>
              <label
                htmlFor="admin-email"
                className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
              >
                Email
              </label>

              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                disabled={createMutation.isPending}
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
              >
                Temporary password
              </label>

              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Minimum 10 characters"
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                disabled={createMutation.isPending}
              />
            </div>

            <div>
              <label
                htmlFor="admin-role"
                className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
              >
                Role
              </label>

              <select
                id="admin-role"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as AdminRole)
                }
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                disabled={createMutation.isPending}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {message && (
              <div
                className={[
                  "lg:col-span-2 rounded-xl border px-4 py-3 text-sm",
                  message.type === "ok"
                    ? "border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
                    : "border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300",
                ].join(" ")}
              >
                {message.text}
              </div>
            )}

            <div className="lg:col-span-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {createMutation.isPending
                  ? "Creating..."
                  : "Create admin"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              Security
            </p>

            <h3 className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Latest TOTP setup
            </h3>

            <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Save these details immediately after admin creation or
              TOTP rotation.
            </p>
          </div>

          {!latestTotpSetup ? (
            <div className="mt-5 rounded-xl border border-dashed border-[#C5D5EE] dark:border-[#34475F] bg-[#F4F8FF] dark:bg-[#16202E] p-5 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              No TOTP setup data available yet.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                  Admin
                </div>

                <div className="mt-1 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {latestTotpSetup.fullName}
                </div>
              </div>

              <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    TOTP secret
                  </div>

                  <CopyButton
                    value={latestTotpSetup.totpSecret}
                  />
                </div>

                <div className="mt-2 break-all rounded-lg border border-[#C5D5EE] dark:border-[#34475F] bg-white dark:bg-[#1E2A3A] px-3 py-2 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {latestTotpSetup.totpSecret}
                </div>
              </div>

              <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Provisioning URI
                  </div>

                  <CopyButton
                    value={latestTotpSetup.totpProvisioningUri}
                  />
                </div>

                <div className="mt-2 max-h-24 overflow-auto break-all rounded-lg border border-[#C5D5EE] dark:border-[#34475F] bg-white dark:bg-[#1E2A3A] px-3 py-2 text-xs text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {latestTotpSetup.totpProvisioningUri}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Existing admins */}
      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col gap-2 border-b border-[#E1E8F2] dark:border-[#2D3F55] px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              Access control
            </p>

            <h3 className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Existing admins
            </h3>

            <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Review administrator status and perform account-security
              actions from one operational table.
            </p>
          </div>

          <div className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
            {admins.length} total accounts
          </div>
        </div>

        {listQuery.isLoading ? (
          <div className="px-6 py-10 text-center text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Loading admins...
          </div>
        ) : listQuery.isError ? (
          <div className="m-6 rounded-xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300">
            {extractApiErrorMessage(listQuery.error)}
          </div>
        ) : admins.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
              No admin accounts found.
            </p>

            <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Create an administrator account using the form above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] w-full border-collapse text-left">
              <thead className="bg-[#F4F8FF] dark:bg-[#16202E]">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Admin
                  </th>

                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Role
                  </th>

                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Account
                  </th>

                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    2FA
                  </th>

                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Dates
                  </th>

                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-[#1E2A3A]">
                {admins.map((admin) => (
                  <AdminRow
                    key={admin.id}
                    admin={admin}
                    currentAdminId={currentAdminId}
                    onActionMessage={setMessage}
                    onRotateSuccess={setLatestTotpSetup}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}