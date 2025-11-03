"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { guestStorage } from "@/lib/utils/guest-storage";
import { toast } from "sonner";

interface GuestEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmailProvided: (email: string) => void;
  title?: string;
  description?: string;
}

export default function GuestEmailModal({
  open,
  onOpenChange,
  onEmailProvided,
  title = "Email Required",
  description = "Please provide your email to track watchlists and receive alerts.",
}: GuestEmailModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<{ email: string }>({
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: { email: string }) => {
    setIsSubmitting(true);
    try {
      // Validate email
      const normalizedEmail = data.email.trim().toLowerCase();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(normalizedEmail)) {
        toast.error("Invalid email", {
          description: "Please enter a valid email address",
        });
        setIsSubmitting(false);
        return;
      }

      // Store email in localStorage
      guestStorage.setGuestEmail(normalizedEmail);

      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event("guestEmailChanged"));

      // Call the callback
      onEmailProvided(normalizedEmail);

      // Close modal
      onOpenChange(false);
      reset();

      toast.success("Email saved successfully!", {
        description: "You can now add stocks to your watchlist and set alerts",
      });
    } catch (error) {
      console.error("Error saving email:", error);
      toast.error("Failed to save email", {
        description: "Please try again later",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-gray-100">{title}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "Please enter a valid email address",
                },
              })}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-app-color hover:bg-app-color-hover text-gray-900"
            >
              {isSubmitting && <Spinner />}
              {isSubmitting ? "Saving..." : "Continue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
