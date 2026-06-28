// components/ui/LinkButton.tsx
import React from "react";
import Link from "next/link";
import clsx from "clsx";

type LinkButtonProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: "primary" | "secondary";
};

export const LinkButton: React.FC<LinkButtonProps> = ({
  href,
  variant = "primary",
  className,
  children,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2.5 font-semibold transition-colors";

  const variants: Record<string, string> = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 shadow-md dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-300",
    secondary:
      "bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-gray-500",
  };

  return (
    <Link href={href} className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </Link>
  );
};
