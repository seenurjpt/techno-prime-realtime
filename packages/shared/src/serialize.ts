import type { PublicUser } from './types';

type Decimalish = { toString(): string } | number | string | null | undefined;
type RawUser = {
  _id: { toString(): string };
  name: string;
  city: string;
  email: string;
  mobile: string;
  amount?: Decimalish;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

const toNumber = (v: Decimalish) => (v == null ? 0 : Number(v.toString()));
const toIso = (v?: Date | string) => (v ? new Date(v).toISOString() : new Date(0).toISOString());

/** Whitelist serializer: works for lean docs AND raw change-stream documents. */
export function toPublicUser(doc: RawUser): PublicUser {
  return {
    id: doc._id.toString(),
    name: doc.name,
    city: doc.city,
    email: doc.email,
    mobile: doc.mobile,
    amount: toNumber(doc.amount),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}
