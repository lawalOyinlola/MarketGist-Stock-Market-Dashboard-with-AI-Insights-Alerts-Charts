import mongoose, { Schema, Document } from "mongoose";

export interface NotificationDocument extends Document {
  userId: string;
  type: "price_alert" | "volume_alert" | "news" | "system";
  title: string;
  message: string;
  symbol?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<NotificationDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["price_alert", "volume_alert", "news", "system"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    symbol: {
      type: String,
      uppercase: true,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, symbol: 1 });

export const Notification =
  mongoose.models.Notification ||
  mongoose.model<NotificationDocument>("Notification", NotificationSchema);




