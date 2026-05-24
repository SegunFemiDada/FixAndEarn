// Path: apps/web/src/components/ui/Button.tsx

import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}