/**
 * Values shared between the browser and the server.
 *
 * Kept apart from `admin.ts` because that module pulls in `next/headers` and
 * the Redis client, neither of which can be imported into a client component.
 */

/**
 * Required on every dashboard write. A cross-origin request cannot set a custom
 * header without a CORS preflight this server never answers, so this is a
 * second, independent CSRF barrier alongside the SameSite=Strict cookie.
 */
export const CSRF_HEADER = "x-pos-csrf";
