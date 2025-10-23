"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FREQUENCY_OPTIONS, ALERT_TYPE_OPTIONS } from "@/lib/constants";
import { Trash2Icon, EditIcon, BellIcon } from "lucide-react";
import { useAlert } from "./AlertProvider";
import { Spinner } from "./ui/spinner";
import InputField from "./forms/InputField";
import SelectField from "./forms/SelectField";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemTitle,
} from "./ui/item";

const AlertModal = ({
  symbol,
  company,
  currentPrice,
  existingAlerts,
  open,
  onClose,
}: AlertModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const { add, remove, update } = useAlert();

  // Form for new alert
  const {
    register: registerNew,
    handleSubmit: handleSubmitNew,
    formState: { errors: errorsNew },
    reset: resetNew,
    watch: watchNew,
    control: controlNew,
  } = useForm<{
    alertName: string;
    alertType: "upper" | "lower";
    threshold: string;
    frequency: "once" | "daily" | "hourly" | "minute";
  }>({
    defaultValues: {
      alertName: "",
      alertType: "upper",
      threshold: "",
      frequency: "daily",
    },
  });

  // Form for editing alert
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: errorsEdit },
    reset: resetEdit,
    watch: watchEdit,
    control: controlEdit,
  } = useForm<{
    alertName: string;
    alertType: "upper" | "lower";
    threshold: string;
    frequency: "once" | "daily" | "hourly" | "minute";
  }>({
    defaultValues: {
      alertName: "",
      alertType: "upper",
      threshold: "",
      frequency: "daily",
    },
  });

  const watchedNewType = watchNew("alertType");

  // Validation functions
  const validateThreshold = (value: string, alertType: "upper" | "lower") => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      return "Threshold must be a positive number";
    }
    if (!currentPrice) {
      return "Current price not available";
    }
    if (alertType === "upper" && numValue <= currentPrice) {
      return `Threshold must be greater than current price ($${currentPrice.toFixed(
        2
      )})`;
    }
    if (alertType === "lower" && numValue >= currentPrice) {
      return `Threshold must be less than current price ($${currentPrice.toFixed(
        2
      )})`;
    }
    return true;
  };

  const handleCreateAlert = handleSubmitNew(async (data) => {
    const thresholdValue = parseFloat(data.threshold);
    setIsLoading(true);
    try {
      await add(
        symbol,
        company,
        data.alertName,
        data.alertType,
        thresholdValue,
        data.frequency
      );
      resetNew();
    } finally {
      setIsLoading(false);
    }
  });

  const handleRemoveAlert = async (alertId: string) => {
    setIsLoading(true);
    try {
      await remove(alertId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAlert = handleSubmitEdit(async (data) => {
    const thresholdValue = parseFloat(data.threshold);
    if (!editingAlertId) return;

    setIsLoading(true);
    try {
      await update(editingAlertId, {
        alertName: data.alertName,
        threshold: thresholdValue,
        frequency: data.frequency,
      });
      setEditingAlertId(null);
      resetEdit();
    } finally {
      setIsLoading(false);
    }
  });

  const startEditing = (alert: any) => {
    setEditingAlertId(alert.id);
    // Reset form with alert data
    resetEdit({
      alertName: alert.alertName,
      alertType: alert.alertType,
      threshold: alert.threshold.toString(),
      frequency: alert.frequency,
    });
  };

  const cancelEditing = () => {
    setEditingAlertId(null);
    resetEdit();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md !bg-gray-800">
        <DialogHeader>
          <DialogTitle>Price Alert</DialogTitle>
          <DialogDescription>
            Set up price alerts for {company} ({symbol})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Price Display */}
          <div className="p-2 bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-500/80">Current Price</div>
            <div className="text-2xl font-bold">
              ${currentPrice?.toFixed(2) || "N/A"}
            </div>
          </div>

          {/* Existing Alerts */}
          {existingAlerts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Latest Alerts</h3>
              {existingAlerts.slice(0, 2).map((alert: any) => (
                <div key={alert.id} className="p-3 border rounded-lg">
                  {editingAlertId === alert.id ? (
                    <form onSubmit={handleEditAlert} className="space-y-4">
                      <InputField
                        name="alertName"
                        label="Alert Name"
                        placeholder="e.g., Apple at Discount"
                        register={registerEdit}
                        error={errorsEdit.alertName}
                        validation={{
                          required: "Alert name is required",
                          minLength: {
                            value: 2,
                            message: "Alert name must be at least 2 characters",
                          },
                        }}
                        value={watchEdit("alertName")}
                      />
                      <InputField
                        name="threshold"
                        label="Threshold Value"
                        placeholder="e.g., 140"
                        type="number"
                        register={registerEdit}
                        error={errorsEdit.threshold}
                        validation={{
                          required: "Threshold is required",
                          validate: (value: string) =>
                            validateThreshold(value, alert.alertType),
                        }}
                        value={watchEdit("threshold")}
                      />
                      <SelectField
                        name="frequency"
                        label="Frequency"
                        placeholder="Select frequency"
                        options={FREQUENCY_OPTIONS}
                        control={controlEdit}
                        error={errorsEdit.frequency}
                        required
                      />
                      <div className="flex gap-2 mt-6">
                        <Button type="submit" size="sm" disabled={isLoading}>
                          {isLoading ? <Spinner /> : "Save"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Item size="sm" className="p-1">
                      <ItemContent className="gap-0">
                        <ItemTitle className="text-[16px]">
                          {alert.alertName}
                        </ItemTitle>
                        <ItemDescription
                          className={
                            alert.alertType === "upper"
                              ? "text-app-color/80"
                              : "text-destructive/80"
                          }
                        >
                          Price {alert.alertType === "upper" ? ">" : "<"} $
                          {alert.threshold}
                        </ItemDescription>
                        <ItemFooter className="text-xs text-gray-500">
                          {alert.frequency === "once"
                            ? "Once"
                            : alert.frequency === "daily"
                            ? "Once per day"
                            : alert.frequency === "hourly"
                            ? "Once per hour"
                            : "Once per minute"}
                        </ItemFooter>
                      </ItemContent>
                      <ItemActions className="gap-2 *:!p-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(alert)}
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveAlert(alert.id)}
                          disabled={isLoading}
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                      </ItemActions>
                    </Item>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Create New Alert */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Create New Alert</h3>

            <form onSubmit={handleCreateAlert} className="space-y-4">
              <InputField
                name="alertName"
                label="Alert Name"
                placeholder="e.g., Apple at Discount"
                register={registerNew}
                error={errorsNew.alertName}
                validation={{
                  required: "Alert name is required",
                  minLength: {
                    value: 2,
                    message: "Alert name must be at least 2 characters",
                  },
                }}
                value={watchNew("alertName")}
              />

              <SelectField
                name="alertType"
                label="Alert Type"
                placeholder="Select alert type"
                options={ALERT_TYPE_OPTIONS}
                control={controlNew}
                error={errorsNew.alertType}
                required
              />

              <InputField
                name="threshold"
                label="Threshold Value"
                placeholder="e.g., 140"
                type="number"
                register={registerNew}
                error={errorsNew.threshold}
                validation={{
                  required: "Threshold is required",
                  validate: (value: string) =>
                    validateThreshold(value, watchedNewType),
                }}
                value={watchNew("threshold")}
              />

              <SelectField
                name="frequency"
                label="Frequency"
                placeholder="Select frequency"
                options={FREQUENCY_OPTIONS}
                control={controlNew}
                error={errorsNew.frequency}
                required
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="group watchlist-btn !rounded-lg"
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    Creating Alert...
                  </>
                ) : (
                  <>
                    <BellIcon className="w-4 h-4 group-hover:fill-current transition-all duration-300" />
                    Create Alert
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AlertModal;
