import classNames from 'classnames';
import React, { useCallback } from 'react';
import {
  Button,
  Dialog,
  IconErrorFill,
  IconAlertCircleFill,
  IconCheckCircleFill,
  IconInfoCircle,
  Table,
} from 'hds-react';
import { useTranslation } from 'react-i18next';
import { ApartmentInstallmentPaymentStatus } from '../../enums';

import formattedCurrency from '../../utils/formatCurrency';
import { ApartmentInstallmentPayment, ApartmentInstallmentPaymentState } from '../../types';
import formatDateTime from '../../utils/formatDateTime';

import styles from './InstallmentPaymentStateInfo.module.scss';

const T_PATH = 'components.installments.InstallmentPaymentStateInfo';

interface IProps {
  state: ApartmentInstallmentPaymentState;
  payments: ApartmentInstallmentPayment[];
  sentToSap: boolean;
}

const StatusLevel = {
  UNIMPORTANT: 'unimportant',
  SUCCESS: 'success',
  IMPORTANT: 'important',
  CRITICAL: 'critical',
} as const;

type StatusLevelValue = typeof StatusLevel[keyof typeof StatusLevel];

const statusLevel = (state: ApartmentInstallmentPaymentState): StatusLevelValue => {
  if (state.status === ApartmentInstallmentPaymentStatus.PAID) {
    if (state.overdue) {
      return StatusLevel.IMPORTANT;
    }
    return StatusLevel.SUCCESS;
  } else if (state.overdue || state.status === ApartmentInstallmentPaymentStatus.OVERPAID) {
    return StatusLevel.CRITICAL;
  } else if (state.status === ApartmentInstallmentPaymentStatus.UNPAID) {
    // UNPAID and not overdue is unimportant
    return StatusLevel.UNIMPORTANT;
  }
  // Rank UNDERPAID as important
  return StatusLevel.IMPORTANT;
};

const statusIcon = (level: StatusLevelValue): JSX.Element | null => {
  switch (level) {
    case StatusLevel.CRITICAL:
      return <IconErrorFill />;
    case StatusLevel.IMPORTANT:
      return <IconAlertCircleFill />;
    case StatusLevel.SUCCESS:
      return <IconCheckCircleFill />;
    case StatusLevel.UNIMPORTANT:
      return null;
  }
};

const InstallmentPaymentStateInfo = ({ state, payments, sentToSap }: IProps) => {
  const { t: translate } = useTranslation();
  const t = (label: string) => translate(`${T_PATH}.${label}`);

  const showPayments = payments?.length || null;

  const [isOpen, setIsOpen] = React.useState(false);
  const open = () => {
    if (showPayments) {
      setIsOpen(true);
    }
  };
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  let messages = [];

  if (!sentToSap) {
    messages.push(t('unsent'));
  } else {
    messages.push(translate(`ENUMS.InstallmentPaymentStatus.${state.status}`));
  }
  if (state.overdue) {
    messages.push(t('overdue'));
  }

  const level = statusLevel(state);

  const mappedPayments = showPayments
    ? payments.map((p, i) => ({
        index: i,
        amount: formattedCurrency(p.amount / 100),
        payment_date: formatDateTime(p.payment_date, true),
      }))
    : [];

  const content = (
    <>
      <div className={styles.messages}>
        {messages.map((message) => (
          <div key={message}>{message}</div>
        ))}
      </div>
      {statusIcon(level)}
    </>
  );

  return showPayments ? (
    <>
      <button className={styles.plainButton} onClick={open}>
        <div className={classNames(styles.container, styles[`status-${level}`])}>{content}</div>
      </button>
      <Dialog
        id="info-dialog"
        aria-labelledby="payment-state-info-dialog-header"
        isOpen={isOpen}
        close={close}
        closeButtonLabelText={t('close')}
      >
        <Dialog.Header
          id="payment-state-info-dialog-header"
          title={t('paymentDetailsTitle')}
          iconLeft={<IconInfoCircle aria-hidden="true" />}
        />
        <Dialog.Content>
          <Table
            cols={[
              { key: 'index', headerName: '-' },
              { key: 'amount', headerName: t('amount') },
              { key: 'payment_date', headerName: t('payment_date') },
            ]}
            rows={mappedPayments}
            indexKey="index"
            renderIndexCol={false}
          />
        </Dialog.Content>
        <Dialog.ActionButtons>
          <Button onClick={close}>{t('close')}</Button>
        </Dialog.ActionButtons>
      </Dialog>
    </>
  ) : (
    <div className={classNames(styles.container, styles[`status-${level}`])}>{content}</div>
  );
};

export default InstallmentPaymentStateInfo;
