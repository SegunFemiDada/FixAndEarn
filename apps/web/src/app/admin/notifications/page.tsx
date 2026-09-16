"use client";

import * as React from "react";
import { extractApiErrorMessage } from "@/lib/admin/queries";
import { useAdminSendNotification } from "@/lib/admin/notifications/queries";
import type { AdminNotificationSendMode } from "@/lib/admin/notifications/types";

const MODE_OPTIONS: Array<{
  label: string;
  value: AdminNotificationSendMode;
}> = [
  { label: "One user", value: "ONE" },
  { label: "Many users", value: "MANY" },
  { label: "All active users", value: "ALL" },
];

const PANEL_CLASS =
  "rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]";

const INPUT_CLASS =
  "mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 disabled:cursor-not-allowed disabled:opacity-60";

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
  const [mode, setMode] =
    React.useState<AdminNotificationSendMode>("ONE");
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [userId, setUserId] = React.useState("");
  const [userIdsRaw, setUserIdsRaw] = React.useState("");
  const [message, setMessage] = React.useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const sendMutation = useAdminSendNotification();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const cleanTitle = title.trim();
    const cleanBody = body.trim();

    if (!cleanTitle) {
      setMessage({
        type: "err",
        text: "Title is required.",
      });
      return;
    }

    if (!cleanBody) {
      setMessage({
        type: "err",
        text: "Message body is required.",
      });
      return;
    }

    if (mode === "ONE" && !userId.trim()) {
      setMessage({
        type: "err",
        text: "User ID is required for one-user notifications.",
      });
      return;
    }

    const parsedUserIds =
      mode === "MANY" ? parseUserIds(userIdsRaw) : undefined;

    if (
      mode === "MANY" &&
      (!parsedUserIds || parsedUserIds.length === 0)
    ) {
      setMessage({
        type: "err",
        text: "Provide at least one user ID for many-user notifications.",
      });
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
          setMessage({
            type: "err",
            text: extractApiErrorMessage(error),
          });
        },
      }
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      {/* Page header */}
      <section className={PANEL_CLASS}>
        <div className="px-6 py-5 xl:px-7 xl:py-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
                Notifications
              </p>

              <h1 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                System notifications
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                Send platform-wide announcements to one user, many users, or
                all active users using the live backend only.
              </p>
            </div>

            <div className="rounded-xl border border-[#D7E2F2] bg-[#F4F8FF] px-4 py-3 dark:border-[#30445C] dark:bg-[#16202E]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#8EA3BC]">
                Delivery
              </p>

              <p className="mt-1 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                Immediate
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Notification composer */}
      <section className={PANEL_CLASS}>
        <div className="border-b border-[#D7E2F2] px-6 py-5 dark:border-[#30445C] xl:px-7">
          <h2 className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            Compose notification
          </h2>

          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Define the recipient scope and notification content before
            sending.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 xl:p-7">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
            {/* Notification content */}
            <div className="rounded-xl border border-[#D7E2F2] bg-[#F8FAFD] p-5 dark:border-[#30445C] dark:bg-[#172334]">
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Notification content
                </h3>

                <p className="mt-1 text-xs leading-5 text-[#6B7C99] dark:text-[#8FA0BC]">
                  Enter the title and message that will be delivered to the
                  selected recipients.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="admin-notification-title"
                    className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
                  >
                    Title
                  </label>

                  <input
                    id="admin-notification-title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Notification title"
                    className={INPUT_CLASS}
                    disabled={sendMutation.isPending}
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-notification-body"
                    className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
                  >
                    Message
                  </label>

                  <textarea
                    id="admin-notification-body"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Write the system notification message"
                    rows={12}
                    className={`${INPUT_CLASS} resize-y`}
                    disabled={sendMutation.isPending}
                  />

                  <p className="mt-2 text-xs leading-5 text-[#6B7C99] dark:text-[#8FA0BC]">
                    This message will be delivered through the platform
                    notification system.
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery scope */}
            <div className="rounded-xl border border-[#D7E2F2] bg-[#F8FAFD] p-5 dark:border-[#30445C] dark:bg-[#172334]">
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Delivery scope
                </h3>

                <p className="mt-1 text-xs leading-5 text-[#6B7C99] dark:text-[#8FA0BC]">
                  Choose who should receive this notification.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="admin-notification-mode"
                    className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
                  >
                    Delivery mode
                  </label>

                  <select
                    id="admin-notification-mode"
                    value={mode}
                    onChange={(event) =>
                      setMode(
                        event.target.value as AdminNotificationSendMode
                      )
                    }
                    className={INPUT_CLASS}
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
                    <label
                      htmlFor="admin-notification-user-id"
                      className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
                    >
                      User ID
                    </label>

                    <input
                      id="admin-notification-user-id"
                      type="text"
                      value={userId}
                      onChange={(event) => setUserId(event.target.value)}
                      placeholder="Enter one user ID"
                      className={INPUT_CLASS}
                      disabled={sendMutation.isPending}
                    />

                    <p className="mt-2 text-xs leading-5 text-[#6B7C99] dark:text-[#8FA0BC]">
                      Enter the exact user ID of the intended recipient.
                    </p>
                  </div>
                ) : mode === "MANY" ? (
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <label
                        htmlFor="admin-notification-user-ids"
                        className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
                      >
                        User IDs
                      </label>

                      <span className="rounded-full bg-[#E8F0FA] px-2.5 py-1 text-xs font-semibold text-[#31557D] dark:bg-[#22364D] dark:text-[#AFC6E1]">
                        {parseUserIds(userIdsRaw).length} selected
                      </span>
                    </div>

                    <textarea
                      id="admin-notification-user-ids"
                      value={userIdsRaw}
                      onChange={(event) =>
                        setUserIdsRaw(event.target.value)
                      }
                      placeholder="Enter multiple user IDs separated by commas or new lines"
                      rows={8}
                      className={`${INPUT_CLASS} resize-y`}
                      disabled={sendMutation.isPending}
                    />

                    <p className="mt-2 text-xs leading-5 text-[#6B7C99] dark:text-[#8FA0BC]">
                      Duplicate user IDs are automatically ignored.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#F5A623] bg-[#FEF8E7] p-4 text-sm text-[#B45309] dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                    <p className="font-semibold">
                      All active users
                    </p>

                    <p className="mt-1 text-xs leading-5">
                      This will send the notification to all active users.
                      Review the message carefully before confirming.
                    </p>
                  </div>
                )}

                {/* Delivery summary */}
                <div className="rounded-xl border border-[#D7E2F2] bg-white p-4 dark:border-[#30445C] dark:bg-[#1B293B]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#8EA3BC]">
                    Delivery summary
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                        Mode
                      </p>

                      <p className="mt-1 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                        {
                          MODE_OPTIONS.find(
                            (option) => option.value === mode
                          )?.label
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                        Recipients
                      </p>

                      <p className="mt-1 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                        {mode === "ONE"
                          ? "1"
                          : mode === "MANY"
                            ? parseUserIds(userIdsRaw).length
                            : "All active"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Result message */}
          {message && (
            <div
              aria-live="polite"
              className={[
                "mt-6 rounded-xl border px-4 py-3 text-sm",
                message.type === "ok"
                  ? "border-[#B8D9B8] bg-[#F0FAF0] text-[#2E7D32] dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
                  : "border-[#F2C0BC] bg-[#FFF4F3] text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300",
              ].join(" ")}
            >
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-4 border-t border-[#D7E2F2] pt-6 dark:border-[#30445C] sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-[#6B7C99] dark:text-[#8FA0BC]">
              The notification is submitted immediately after confirmation.
            </p>

            <button
              type="submit"
              disabled={sendMutation.isPending}
              className="inline-flex items-center justify-center rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#3B82F6] dark:hover:bg-[#2563EB]"
            >
              {sendMutation.isPending
                ? "Sending..."
                : "Send notification"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}