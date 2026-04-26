// Path: apps/web/src/app/admin/notifications/page.tsx
"use client";

import * as React from "react";
import { extractApiErrorMessage } from "@/lib/admin/queries";
import { useAdminSendNotification } from "@/lib/admin/notifications/queries";
import type { AdminNotificationSendMode } from "@/lib/admin/notifications/types";

const MODE_OPTIONS: Array<{ label: string; value: AdminNotificationSendMode }> = [
  { label: "One user", value: "ONE" },
  { label: "Many users", value: "MANY" },
  { label: "All active users", value: "ALL" },
];

function parseUserIds(input: string) {
  return Array.from(
    new Set(
      input
        .split(/[\n,]/g)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

export default function AdminNotificationsPage() {
  const [mode, setMode] = React.useState<AdminNotificationSendMode>("ONE");
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [userId, setUserId] = React.useState("");
  const [userIdsRaw, setUserIdsRaw] = React.useState("");
  const [message, setMessage] = React.useState<{ type: "ok" | "err"; text: string } | null>(null);

  const sendMutation = useAdminSendNotification();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const cleanTitle = title.trim();
    const cleanBody = body.trim();

    if (!cleanTitle) {
      setMessage({ type: "err", text: "Title is required." });
      return;
    }

    if (!cleanBody) {
      setMessage({ type: "err", text: "Message body is required." });
      return;
    }

    if (mode === "ONE" && !userId.trim()) {
      setMessage({ type: "err", text: "User ID is required for one-user notifications." });
      return;
    }

    const parsedUserIds = mode === "MANY" ? parseUserIds(userIdsRaw) : undefined;

    if (mode === "MANY" && (!parsedUserIds || parsedUserIds.length === 0)) {
      setMessage({ type: "err", text: "Provide at least one user ID for many-user notifications." });
      return;
    }

    const confirmed = window.confirm(
      mode === "ALL"
        ? "Send this notification to all active users?"
        : mode === "MANY"
          ? `Send this notification to ${parsedUserIds?.length ?? 0} users?`
          : "Send this notification to the selected user?"
    );

    if (!confirmed) return;

    sendMutation.mutate(
      {
        mode,
        title: cleanTitle,
        body: cleanBody,
        userId: mode === "ONE" ? userId.trim() : undefined,
        userIds: mode === "MANY" ? parsedUserIds : undefined,
      },
      {
        onSuccess: (response) => {
          const countText =
            typeof response.createdCount === "number"
              ? `${response.createdCount} notifications created for ${response.recipientCount} recipients.`
              : `${response.recipientCount} recipient(s).`;

          setMessage({
            type: "ok",
            text: `Notification sent successfully. ${countText}`,
          });

          setTitle("");
          setBody("");
          setUserId("");
          setUserIdsRaw("");
        },
        onError: (error) => {
          setMessage({ type: "err", text: extractApiErrorMessage(error) });
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">Notifications</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">System notifications</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Send platform-wide announcements to one user, many users, or all active users using the live backend only.
        </p>
      </section>

      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label htmlFor="admin-notification-mode" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                Delivery mode
              </label>
              <select
                id="admin-notification-mode"
                value={mode}
                onChange={(event) => setMode(event.target.value as AdminNotificationSendMode)}
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                disabled={sendMutation.isPending}
              >
                {MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {mode === "ONE" ? (
              <div>
                <label htmlFor="admin-notification-user-id" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                  User ID
                </label>
                <input
                  id="admin-notification-user-id"
                  type="text"
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  placeholder="Enter one user ID"
                  className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  disabled={sendMutation.isPending}
                />
              </div>
            ) : mode === "MANY" ? (
              <div>
                <label htmlFor="admin-notification-user-ids" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                  User IDs
                </label>
                <textarea
                  id="admin-notification-user-ids"
                  value={userIdsRaw}
                  onChange={(event) => setUserIdsRaw(event.target.value)}
                  placeholder="Enter multiple user IDs separated by commas or new lines"
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  disabled={sendMutation.isPending}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 p-4 text-sm text-[#B45309] dark:text-amber-300">
                This will send the notification to all active users.
              </div>
            )}
          </div>

          <div>
            <label htmlFor="admin-notification-title" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
              Title
            </label>
            <input
              id="admin-notification-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Notification title"
              className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
              disabled={sendMutation.isPending}
            />
          </div>

          <div>
            <label htmlFor="admin-notification-body" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
              Message
            </label>
            <textarea
              id="admin-notification-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write the system notification message"
              rows={7}
              className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
              disabled={sendMutation.isPending}
            />
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

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sendMutation.isPending}
              className="inline-flex items-center justify-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-5 py-3 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendMutation.isPending ? "Sending..." : "Send notification"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}