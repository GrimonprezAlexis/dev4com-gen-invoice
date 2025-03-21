import * as React from "react";
import { toast } from "sonner";

export function useToast() {
  return React.useMemo(
    () => ({
      toast: toast,
      dismiss: toast.dismiss,
      error: toast.error,
      success: toast.success,
      info: toast.info,
      warning: toast.warning,
      promise: toast.promise,
      custom: toast.custom,
    }),
    []
  );
}