import { MiddlewareAPI, isRejectedWithValue, Middleware } from '@reduxjs/toolkit';

import { toast } from '../../components/common/toast/ToastManager';

export const rtkQueryErrorLogger: Middleware = (api: MiddlewareAPI) => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const errorTitle = action.error.message;
    const payloadData = action.payload.data;
    let errorMessage = undefined;

    if (payloadData) {
      if (Array.isArray(payloadData)) {
        errorMessage = payloadData[0]?.message;
      } else {
        errorMessage = payloadData?.detail || payloadData?.message;
      }
    }

    toast.show({ type: 'error', title: errorTitle, content: errorMessage });
  }

  return next(action);
};
