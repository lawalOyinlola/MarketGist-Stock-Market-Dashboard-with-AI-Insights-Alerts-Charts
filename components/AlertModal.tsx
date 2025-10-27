"use client";

import { useState, useEffect } from "react";
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
import InputGroupField from "./forms/InputGroupField";
import { InputGroupAddon, InputGroupText } from "./ui/input-group";

const AlertModal = ({
  symbol,
  company,
  currentPrice,
  existingAlerts,
  open,
  onClose,
  editAlertId,
}: AlertModalProps) => {
  const [isLoading, setIsLoading] = useState<
    "create" | "edit" | "delete" | null
  >(null);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(
    editAlertId || null
  );
  const { add, remove, update } = useAlert();

  // Check if we're in edit mode
  const isEditMode = !!editAlertId;

  // Find the alert to edit
  const alertToEdit = editAlertId
    ? existingAlerts.find((alert) => alert.id === editAlertId)
    : null;

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

  // Initialize edit form when editAlertId is provided
  useEffect(() => {
    if (editAlertId && alertToEdit) {
      setEditingAlertId(editAlertId);
      resetEdit({
        alertName: alertToEdit.alertName,
        alertType: alertToEdit.alertType,
        threshold: alertToEdit.threshold.toString(),
        frequency: alertToEdit.frequency,
      });
    }
  }, [editAlertId, alertToEdit, resetEdit]);

  // Clear form state when modal closes
  useEffect(() => {
    if (!open) {
      resetNew();
      resetEdit();
      setEditingAlertId(null);
    }
  }, [open, resetNew, resetEdit]);

  // Clear editing state when editAlertId becomes falsy
  useEffect(() => {
    if (!editAlertId) {
      setEditingAlertId(null);
      resetEdit();
    }
  }, [editAlertId, resetEdit]);

  // Validation functions
  const validateThreshold = (value: string, alertType: "upper" | "lower") => {
    // First check if the input matches the number pattern (max 2 decimal places)
    const numberPattern = /^[0-9]+(\.[0-9]{1,2})?$/;
    if (!numberPattern.test(value.trim())) {
      return "Please enter a valid number with max 2 decimal places (e.g., 140 or 140.50)";
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      return "Threshold must be a positive number";
    }
    if (!currentPrice) {
      return "Current price not available";
    }
    if (
      currentPrice != null &&
      alertType === "upper" &&
      numValue <= currentPrice
    ) {
      return `Threshold must be greater than current price ($${currentPrice.toFixed(
        2
      )})`;
    }
    if (
      currentPrice != null &&
      alertType === "lower" &&
      numValue >= currentPrice
    ) {
      return `Threshold must be less than current price ($${currentPrice.toFixed(
        2
      )})`;
    }
    return true;
  };

  const handleCreateAlert = handleSubmitNew(async (data) => {
    const thresholdValue = parseFloat(data.threshold);
    setIsLoading("create");
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
      setIsLoading(null);
    }
  });

  const handleRemoveAlert = async (alertId: string) => {
    setIsLoading("delete");
    try {
      await remove(alertId);
    } finally {
      setIsLoading(null);
    }
  };

  const handleEditAlert = handleSubmitEdit(async (data) => {
    const thresholdValue = parseFloat(data.threshold);
    if (!editingAlertId) return;

    setIsLoading("edit");
    try {
      await update(editingAlertId, {
        alertName: data.alertName,
        alertType: data.alertType,
        threshold: thresholdValue,
        frequency: data.frequency,
      });
      setEditingAlertId(null);
      resetEdit();
      // Close modal after successful save in edit mode
      if (isEditMode) {
        onClose();
      }
    } finally {
      setIsLoading(null);
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
    // Close modal when cancel is clicked in edit mode
    if (isEditMode) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md !bg-gray-800 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Alert" : "Price Alert"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Edit alert for ${company} (${symbol})`
              : `Set up price alerts for ${company} (${symbol})`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
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
              <h3 className="text-sm font-medium">
                {isEditMode ? "Edit Alert" : "Latest Alerts"}
              </h3>

              {(isEditMode && alertToEdit
                ? [alertToEdit]
                : existingAlerts.slice().reverse().slice(0, 2)
              ).map((alert: any) => (
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
                      <SelectField
                        name="alertType"
                        label="Alert Type"
                        placeholder="Select alert type"
                        options={ALERT_TYPE_OPTIONS}
                        control={controlEdit}
                        error={errorsEdit.alertType}
                        required
                      />

                      <InputGroupField
                        name="threshold"
                        label="Threshold Value"
                        placeholder="e.g., 140.50"
                        register={registerEdit}
                        error={errorsEdit.threshold}
                        validation={{
                          required: "Threshold is required",
                          pattern: {
                            value: /^[0-9]+(\.[0-9]{1,2})?$/,
                            message:
                              "Please enter a valid number with max 2 decimal places (e.g., 140 or 140.50)",
                          },
                          validate: (value: string) =>
                            validateThreshold(value, watchEdit("alertType")),
                        }}
                        value={watchEdit("threshold")}
                      >
                        <InputGroupAddon>
                          <InputGroupText className="text-app-color text-base">
                            $
                          </InputGroupText>
                        </InputGroupAddon>
                        <InputGroupAddon align="inline-end">
                          <InputGroupText>USD</InputGroupText>
                        </InputGroupAddon>
                      </InputGroupField>

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
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isLoading === "edit"}
                        >
                          {isLoading ? <Spinner /> : "Save"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                          disabled={isLoading === "edit"}
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
                          disabled={isLoading === "edit"}
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveAlert(alert.id)}
                          disabled={isLoading === "delete"}
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
          {!isEditMode && (
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

                <InputGroupField
                  name="threshold"
                  label="Threshold Value"
                  placeholder="e.g., 140.50"
                  register={registerNew}
                  error={errorsNew.threshold}
                  validation={{
                    required: "Threshold is required",
                    pattern: {
                      value: /^[0-9]+(\.[0-9]{1,2})?$/,
                      message:
                        "Please enter a valid number with max 2 decimal places (e.g., 140 or 140.50)",
                    },
                    validate: (value: string) =>
                      validateThreshold(value, watchedNewType),
                  }}
                  value={watchNew("threshold")}
                >
                  <InputGroupAddon>
                    <InputGroupText className="text-app-color text-base">
                      $
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>USD</InputGroupText>
                  </InputGroupAddon>
                </InputGroupField>

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
                  disabled={!!isLoading}
                  className="group watchlist-btn !rounded-lg"
                >
                  {!!isLoading ? (
                    <>
                      <Spinner />
                      {isLoading === "edit"
                        ? "Updating Alert..."
                        : isLoading === "create"
                        ? "Creating Alert..."
                        : "Deleting Alert..."}
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AlertModal;
