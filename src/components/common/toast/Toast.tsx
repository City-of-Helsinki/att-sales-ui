import React, { useEffect } from 'react';
import cx from 'classnames';
import { Notification } from 'hds-react';
import { useTranslation } from 'react-i18next';

const T_PATH = 'components.common.toast.Toast';

export type ToastProps = {
  content?: string;
  destroy: () => void;
  duration?: number;
  id: string;
  title?: string;
  type: 'error' | 'success';
  showAsModal?: boolean;
  onCloseActions?: () => void;
};

const Toast = ({
  content,
  destroy,
  duration = 6000,
  title,
  type,
  showAsModal = false,
  onCloseActions = undefined,
}: ToastProps): JSX.Element => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!duration) return;

    const timer = setTimeout(() => {
      destroy();
    }, duration);

    return () => clearTimeout(timer);
  }, [destroy, duration]);

  const renderDefaultLabel = (): string => {
    let label = t(`${T_PATH}.errorLabel`);

    if (type === 'success') {
      label = t(`${T_PATH}.successLabel`);
    }

    return label;
  };

  const renderDefaultMessage = (): string => {
    let message = t(`${T_PATH}.defaultErrorMessage`);

    if (type === 'success') {
      message = t(`${T_PATH}.defaultSuccessMessage`);
    }

    return message;
  };

  const onClose = () => {
    if (onCloseActions) {
      onCloseActions();
    }
    destroy();
  };

  const renderNotification = () => (
    <Notification
      autoClose
      autoCloseDuration={duration}
      className={cx('custom-toast', showAsModal && 'as-modal')}
      closeButtonLabelText={t(`${T_PATH}.ariaCloseNotification`)}
      dismissible
      displayAutoCloseProgress
      label={title ? title : renderDefaultLabel()}
      onClose={() => onClose()}
      position="top-right"
      size="default"
      type={type}
    >
      {content ? content : renderDefaultMessage()}
    </Notification>
  );

  if (showAsModal) {
    return (
      <div className="custom-toast-modal-container">
        <div className="custom-toast-modal-content">{renderNotification()}</div>
        <div className="custom-toast-modal-overlay" />
      </div>
    );
  }

  return renderNotification();
};

const shouldRerender = (prevProps: ToastProps, nextProps: ToastProps) => {
  return prevProps.id === nextProps.id;
};

export default React.memo(Toast, shouldRerender);
