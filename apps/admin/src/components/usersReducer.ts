import type { PublicUser, UserEvent } from '@tp/shared/types';

export type UsersAction = UserEvent | { type: 'replace'; users: PublicUser[] };

const byNewest = (a: PublicUser, b: PublicUser) => b.createdAt.localeCompare(a.createdAt);

/**
 * Idempotent: the same change can arrive twice (once from our own API response,
 * once from the live stream). Upserting by id makes the second arrival a no-op,
 * and `updatedAt` stops an older snapshot from overwriting a newer one.
 */
export function usersReducer(state: PublicUser[], action: UsersAction): PublicUser[] {
  switch (action.type) {
    case 'replace':
      return [...action.users].sort(byNewest);
    case 'delete':
      return state.some((u) => u.id === action.id) ? state.filter((u) => u.id !== action.id) : state;
    case 'upsert': {
      const i = state.findIndex((u) => u.id === action.user.id);
      if (i === -1) return [action.user, ...state].sort(byNewest);
      if (state[i].updatedAt > action.user.updatedAt) return state;
      if (JSON.stringify(state[i]) === JSON.stringify(action.user)) return state;
      const next = state.slice();
      next[i] = action.user;
      return next;
    }
  }
}
