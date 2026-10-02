import mongoose, { type InferSchemaType, type Model } from 'mongoose';

// mongoose is CommonJS; Node's ESM loader can't see `models` as a named export, so read it off the default.
const { Schema, model, models } = mongoose;

const adminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    amount: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString('0.00'),
    },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);
userSchema.index({ createdAt: -1 });

const transactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    delta: { type: Schema.Types.Decimal128, required: true },
    balanceAfter: { type: Schema.Types.Decimal128, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    note: { type: String, trim: true, maxlength: 140 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type AdminDoc = InferSchemaType<typeof adminSchema>;
export type UserDoc = InferSchemaType<typeof userSchema>;
export type TransactionDoc = InferSchemaType<typeof transactionSchema>;

// `models.X ||` guards against OverwriteModelError during hot reload.
export const Admin = (models.Admin as Model<AdminDoc>) || model<AdminDoc>('Admin', adminSchema);
export const User = (models.User as Model<UserDoc>) || model<UserDoc>('User', userSchema);
export const Transaction =
  (models.Transaction as Model<TransactionDoc>) ||
  model<TransactionDoc>('Transaction', transactionSchema);
