// Path: apps/web/src/lib/account/queries.ts
import { useMutation } from "@tanstack/react-query";
import { switchRole } from "./api";

export function useSwitchRole() {
  return useMutation({
    mutationFn: (payload: { role: "CLIENT" | "FIXER" }) => switchRole(payload),
  });
}
