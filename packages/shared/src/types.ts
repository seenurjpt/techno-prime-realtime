/** Public shape of a user — never includes the password hash. Safe to send to browsers. */
export interface PublicUser {
  id: string;
  name: string;
  city: string;
  email: string;
  mobile: string;
  /** Exact decimal value, 2dp. Stored as Decimal128 in Mongo so repeated top-ups never drift. */
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export type Role = 'admin' | 'user';

export interface SessionPayload {
  sub: string;
  role: Role;
  email: string;
  name?: string;
}

/** Events pushed over Server-Sent Events. */
export type UserEvent =
  | { type: 'upsert'; user: PublicUser }
  | { type: 'delete'; id: string };
