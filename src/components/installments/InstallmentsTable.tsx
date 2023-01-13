import React, { useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import { Button, Dialog, IconPrinter, IconAlertCircleFill, IconCheckCircleFill } from 'hds-react';
import { useTranslation } from 'react-i18next';

import formattedCurrency from '../../utils/formatCurrency';
import InstallmentsInvoice from './InstallmentsInvoice';
import InstallmentsTableRow from './InstallmentsTableRow';
import { Apartment, ApartmentInstallment, ApartmentReservation, Project } from '../../types';
import { InstallmentTypes } from '../../enums';

import styles from './InstallmentsTable.module.scss';

const T_PATH = 'components.installments.InstallmentsTable';

interface IProps {
  apartment: Apartment;
  installments: ApartmentInstallment[];
  project: Project;
  reservationId: ApartmentReservation['id'];
  targetPrice?: number;
}

const InstallmentsTable = ({ apartment, installments, project, reservationId, targetPrice }: IProps) => {
  const { t } = useTranslation();
  const [isPrintInvoiceDialogOpen, setIsPrintInvoiceDialogOpen] = useState(false);
  const [totalSum, setTotalSum] = useState(0);
  const openPrintDialogButtonRef = useRef(null);
  const closePrintDialog = () => setIsPrintInvoiceDialogOpen(false);

  // Calculate total sum of all amount fields
  useEffect(() => {
    const sum = installments.reduce((previousValue, currentValue) => {
      return previousValue + currentValue.amount;
    }, 0);
    setTotalSum(sum);
  }, [installments]);

  const handleCloseCallback = () => {
    closePrintDialog();
  };

  // Sort rows in the order of the InstallmentTypes ENUM list
  const sortedInstallments = () => {
    const InstallmentOrder = Object.values(InstallmentTypes);
    const installmentsCopy = [...installments];
    return installmentsCopy.sort((a, b) =>
      a.type
        ? b.type
          ? InstallmentOrder.indexOf(a.type as InstallmentTypes) - InstallmentOrder.indexOf(b.type as InstallmentTypes)
          : -1
        : 1
    );
  };

  const sumsMatch = (value: number, target: number) => {
    if (value === target) return true;
    return false;
  };

  const renderSumMatchIcon = () => {
    if (targetPrice) {
      if (!sumsMatch(totalSum, targetPrice)) {
        return <IconAlertCircleFill size="xs" color="var(--color-error)" style={{ marginBottom: -2 }} />;
      }
      return <IconCheckCircleFill size="xs" color="var(--color-tram)" style={{ marginBottom: -2 }} />;
    }
  };

  const renderTableHeaders = () => (
    <thead className="hds-table__header-row">
      <tr>
        <th>{t(`${T_PATH}.installmentType`)}</th>
        <th style={{ textAlign: 'right' }}>{t(`${T_PATH}.sum`)}</th>
        <th>{t(`${T_PATH}.dueDate`)}</th>
        <th>{t(`${T_PATH}.IbanAccountNumber`)}</th>
        <th>{t(`${T_PATH}.referenceNumber`)}</th>
        <th>{t(`${T_PATH}.status`)}</th>
        <th>{t(`${T_PATH}.sentToSAP`)}</th>
      </tr>
    </thead>
  );

  const renderTableContent = () => (
    <tbody className="hds-table__content">
      {!!sortedInstallments().length &&
        sortedInstallments().map((installment) => (
          <InstallmentsTableRow key={installment.type} installment={installment} reservationId={reservationId} />
        ))}
    </tbody>
  );

  const renderTableFooter = () => (
    <tfoot className="hds-table__content">
      <tr>
        <td>
          <strong>{t(`${T_PATH}.total`)}</strong>
        </td>
        <td style={{ textAlign: 'right' }}>
          <strong>
            {renderSumMatchIcon()} {formattedCurrency(totalSum / 100)}
          </strong>
        </td>
        <td colSpan={4}></td>
      </tr>
    </tfoot>
  );

  const renderPrintDialog = () => (
    <Dialog
      id="print-dialog"
      aria-labelledby="print-dialog-header"
      isOpen={isPrintInvoiceDialogOpen}
      close={closePrintDialog}
      closeButtonLabelText={t(`${T_PATH}.closeDialog`)}
      focusAfterCloseRef={openPrintDialogButtonRef}
      className={styles.printDialog}
    >
      <Dialog.Header id="print-dialog-header" title={t(`${T_PATH}.printBankTransfers`)} />
      <Dialog.Content>
        <InstallmentsInvoice
          apartment={apartment}
          handleCloseCallback={handleCloseCallback}
          installments={installments}
          project={project}
          reservationId={reservationId}
        />
      </Dialog.Content>
    </Dialog>
  );

  return (
    <div className={styles.installmentsWrapper}>
      <table className={cx(styles.installmentsTable, 'hds-table hds-table--light')}>
        {renderTableHeaders()}
        {renderTableContent()}
        {renderTableFooter()}
      </table>
      <Button
        variant="primary"
        size="small"
        iconLeft={<IconPrinter />}
        ref={openPrintDialogButtonRef}
        onClick={() => setIsPrintInvoiceDialogOpen(true)}
      >
        {t(`${T_PATH}.printBankTransfers`)}
      </Button>
      {renderPrintDialog()}
    </div>
  );
};

export default InstallmentsTable;
