import mongoose from "mongoose";

const EmailPreferenceSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    unsubscribed: {
      type: Boolean,
      default: false,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
    unsubscribeReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const EmailPreference =
  mongoose.models?.EmailPreference ||
  mongoose.model("EmailPreference", EmailPreferenceSchema);
