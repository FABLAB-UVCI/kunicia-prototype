"use client";

import { useSyncExternalStore } from "react";
import { getServerStatus, subscribeServerStatus } from "@/lib/server-status";

export function useServerStatus(): boolean {
  return useSyncExternalStore(subscribeServerStatus, getServerStatus, () => true);
}
