//path: apps/web/src/lib/users/queries.ts
import { useQuery } from "@tanstack/react-query";
import { discoverFixers } from "./api";
import type { DiscoverFixersParams } from "./types";

export function useDiscoverFixers(
  params?: DiscoverFixersParams,
  enabled = true
) {
  return useQuery({
    queryKey: ["users", "fixers", "discover", params ?? {}],
    queryFn: () => discoverFixers(params),
    enabled,
    staleTime: 10_000,
    retry: 1,
  });
}