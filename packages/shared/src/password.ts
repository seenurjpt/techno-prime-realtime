import bcrypt from 'bcryptjs';

const ROUNDS = 10;
export const hashPassword = (plain: string) => bcrypt.hash(plain, ROUNDS);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

let dummy: string | undefined;
/**
 * Compared against when the email doesn't exist, so the response time
 * doesn't reveal which emails are registered.
 */
export const dummyHash = () => (dummy ??= bcrypt.hashSync('timing-equaliser', ROUNDS));
