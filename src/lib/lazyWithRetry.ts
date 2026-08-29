import { lazy, ComponentType } from "react";

const RELOAD_KEY = "atlas-chunk-reload";

/**
 * React.lazy wrapper that recovers from stale chunk hashes after a new deploy.
 * If a dynamic import fails (old hashed file no longer exists), retry once,
 * then force a single hard reload to pick up the new asset manifest.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      sessionStorage.removeItem(RELOAD_KEY);
      return mod;
    } catch (error) {
      // Second chance: transient network failure.
      try {
        const mod = await factory();
        sessionStorage.removeItem(RELOAD_KEY);
        return mod;
      } catch {
        const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY) === "1";
        if (!alreadyReloaded) {
          sessionStorage.setItem(RELOAD_KEY, "1");
          window.location.reload();
          // Never resolves — the page is reloading.
          return new Promise<{ default: T }>(() => {});
        }
        throw error;
      }
    }
  });
}
