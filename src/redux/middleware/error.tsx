import { MiddlewareAPI, isRejectedWithValue, Middleware } from '@reduxjs/toolkit';

import i18n from '../../i18n/i18n';
import { getClient } from '../../auth/oidc-react';
import { toast } from '../../components/common/toast/ToastManager';

export const rtkQueryErrorLogger: Middleware = (api: MiddlewareAPI) => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const errorTitle = action.error.message;
    const payloadData = action.payload.data;
    const payloadStatus = action.payload.status;
    let errorMessage = undefined;

    if (payloadData) {
      if (Array.isArray(payloadData)) {
        errorMessage = payloadData[0]?.message;
      } else {
        errorMessage = payloadData?.detail || payloadData?.message;
      }
    }

    if (errorMessage?.message) {
      errorMessage = errorMessage.message;
    }

    // Check if we have an unauthorized error
    if (payloadStatus === 401 || payloadStatus === 403) {
      const client = getClient();

      // Show unathorized specific error toast
      toast.show({
        type: 'error',
        title: i18n.t('error.unauthorizedTitle'),
        content: i18n.t('error.automaticLogoutMessage'),
        showAsModal: true,
        onCloseActions: () => client.logout(), // Log out the user automatically when toast closes
      });
    } else {
      toast.show({ type: 'error', title: errorTitle, content: errorMessage });
    }
  }

  return next(action);
};
