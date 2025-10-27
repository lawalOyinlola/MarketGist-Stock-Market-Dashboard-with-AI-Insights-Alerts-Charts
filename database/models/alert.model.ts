import mongoose, { Schema, Document } from "mongoose";

export interface AlertDocument extends Document {
  userId: string;
  symbol: string;
  company: string;
  alertName: string;
  alertType: "upper" | "lower";
  threshold: number;
  frequency: "once" | "daily" | "hourly" | "minute";
  isActive: boolean;
  lastTriggeredAt?: Date; // Track when alert was last triggered for frequency control
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<AlertDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    company: {
      type: String,
      required: true,
    },
    alertName: {
      type: String,
      required: true,
    },
    alertType: {
      type: String,
      enum: ["upper", "lower"],
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
    },
    frequency: {
      type: String,
      enum: ["once", "daily", "hourly", "minute"],
      default: "daily",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastTriggeredAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
AlertSchema.index({ userId: 1, symbol: 1 });
AlertSchema.index({ symbol: 1, isActive: 1 });

// Unique partial index to prevent duplicate active alerts
AlertSchema.index(
  { userId: 1, symbol: 1, alertType: 1, threshold: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
    name: "unique_active_alert_per_user_symbol_type_threshold",
  }
);

export const Alert =
  mongoose.models.Alert || mongoose.model<AlertDocument>("Alert", AlertSchema);
