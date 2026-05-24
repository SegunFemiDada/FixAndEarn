// Path: apps/web/src/components/chats/ChatRefreshButton.tsx

"use client";

type Props = {
  loading: boolean;
  onRefresh: () => void;
};

export default function ChatRefreshButton({
  loading,
  onRefresh,
}: Props) {
  return (
    <button
      onClick={onRefresh}
      disabled={loading}
      className="text-sm text-[#5B8FCC]"
    >
      {loading
        ? "Refreshing..."
        : "Refresh"}
    </button>
  );
}