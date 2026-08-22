// Shared in-memory user store for accounts created when DB is offline or proxy
export type FallbackUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  state?: string;
  role: string;
};

export const fallbackUsersStore: Map<string, FallbackUser> =
  (global as Record<string, unknown>).__yojanasetu_users_store__ as Map<string, FallbackUser> ||
  (() => {
    const m = new Map<string, FallbackUser>();
    (global as Record<string, unknown>).__yojanasetu_users_store__ = m;
    return m;
  })();
