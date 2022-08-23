import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, IconQuestionCircle } from 'hds-react';

import formatDateTime from '../../utils/formatDateTime';
import formattedCurrency from '../../utils/formatCurrency';
import { ApartmentInstallment, ApartmentReservation } from '../../types';
import { useSendApartmentInstallmentsToSAPMutation } from '../../redux/services/api';
import { toast } from '../common/toast/ToastManager';

import styles from './InstallmentsTableRow.module.scss';

const T_PATH = 'components.installments.InstallmentsTableRow';

interface IProps {
  installment: ApartmentInstallment;
  reservationId: ApartmentReservation['id'];
}

const InstallmentsTableRow = ({ installment, reservationId }: IProps) => {
  const { t } = useTranslation();
  const openConfirmationDialogButtonRef = useRef(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const installmentAmount = installment.amount / 100;
  const [sendApartmentInstallmentsToSAP, { isLoading: isLoadingSendToSAP }] =
    useSendApartmentInstallmentsToSAPMutation();

  const closeConfirmation = () => setIsConfirmationOpen(false);

  const handleSendToSAP = async () => {
    if (!isLoadingSendToSAP) {
      try {
        await sendApartmentInstallmentsToSAP({ types: [installment.type], id: reservationId })
          .unwrap()
          .then(() => {
            // Show success toast
            toast.show({ type: 'success', content: t(`${T_PATH}.sentSuccessfully`) });
            closeConfirmation();
          });
      } catch (err: any) {
        toast.show({ type: 'error' });
      }
    }
  };

  const renderConfirmationDialog = () => (
    <Dialog
      id="confirmation-dialog"
      aria-labelledby="confirmation-dialog-title"
      isOpen={isConfirmationOpen}
      focusAfterCloseRef={openConfirmationDialogButtonRef}
    >
      <Dialog.Header
        id="confirmation-dialog-title"
        title={t(`${T_PATH}.areYouSure`)}
        iconLeft={<IconQuestionCircle aria-hidden="true" />}
      />
      <Dialog.Content>
        <p>{t(`${T_PATH}.infoTextSendingToSAP`)}</p>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <tbody>
              <tr>
                <th style={{ textAlign: 'right' }}>{t(`${T_PATH}.installmentType`)}</th>
                <td>{t(`ENUMS.InstallmentTypes.${installment.type}`)}</td>
              </tr>
              <tr>
                <th style={{ textAlign: 'right' }}>{t(`${T_PATH}.sum`)}</th>
                <td>{formattedCurrency(installmentAmount)}</td>
              </tr>
              <tr>
                <th style={{ textAlign: 'right' }}>{t(`${T_PATH}.dueDate`)}</th>
                <td>{installment.due_date ? formatDateTime(installment.due_date, true) : '-'}</td>
              </tr>
              <tr>
                <th style={{ textAlign: 'right' }}>{t(`${T_PATH}.IbanAccountNumber`)}</th>
                <td>{installment.account_number}</td>
              </tr>
              <tr>
                <th style={{ textAlign: 'right' }}>{t(`${T_PATH}.referenceNumber`)}</th>
                <td>{installment.reference_number}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Dialog.Content>
      <Dialog.ActionButtons>
        <Button
          disabled={!!installment.added_to_be_sent_to_sap_at || !installment.due_date || isLoadingSendToSAP}
          onClick={() => handleSendToSAP()}
        >
          {t(`${T_PATH}.sendToSAP`)}
        </Button>
        <Button onClick={closeConfirmation} variant="secondary">
          {t(`${T_PATH}.cancel`)}
        </Button>
      </Dialog.ActionButtons>
    </Dialog>
  );

  return (
    <tr>
      <td>{t(`ENUMS.InstallmentTypes.${installment.type}`)}</td>
      <td style={{ textAlign: 'right' }}>{formattedCurrency(installmentAmount)}</td>
      <td>{installment.due_date ? formatDateTime(installment.due_date, true) : '-'}</td>
      <td>{installment.account_number}</td>
      <td>{installment.reference_number}</td>
      <td className={styles.buttonCell}>
        {!!installment.added_to_be_sent_to_sap_at ? (
          <>
            {t(`${T_PATH}.sent`)} {formatDateTime(installment.added_to_be_sent_to_sap_at, false)}
          </>
        ) : (
          <Button
            variant="secondary"
            size="small"
            ref={openConfirmationDialogButtonRef}
            onClick={() => setIsConfirmationOpen(true)}
            disabled={!installment.due_date || isLoadingSendToSAP}
          >
            {t(`${T_PATH}.sendToSAP`)}
          </Button>
        )}
      </td>
      <>{renderConfirmationDialog()}</>
    </tr>
  );
};

export default InstallmentsTableRow;
