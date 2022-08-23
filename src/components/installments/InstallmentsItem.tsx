import React, { useRef, useState } from 'react';
import cx from 'classnames';
import { Button, Dialog, IconAngleDown, IconAngleRight, IconPenLine, Notification, useAccordion } from 'hds-react';
import { useTranslation } from 'react-i18next';

import formattedLivingArea from '../../utils/formatLivingArea';
import formattedSalesPrice from '../../utils/formatSalesPrice';
import i18n from '../../i18n/i18n';
import InstallmentsForm from './InstallmentsForm';
import InstallmentsTable from './InstallmentsTable';
import ProjectName from '../project/ProjectName';
import { Apartment, ApartmentReservation, Project } from '../../types';
import { useGetApartmentReservationQuery } from '../../redux/services/api';

import styles from './InstallmentsItem.module.scss';

const T_PATH = 'components.installments.InstallmentsItem';

interface IProps {
  apartment: Apartment;
  project: Project;
  reservationId: ApartmentReservation['id'];
  isCanceled: boolean;
}

export const renderApartmentDetails = (apartment: Apartment) => (
  <div className={styles.apartmentStructure}>
    <span className={styles.emphasized}>{apartment.apartment_number}</span>
    <span>
      {apartment.apartment_structure} ({formattedLivingArea(apartment.living_area)})
    </span>
  </div>
);

export const renderApartmentPrice = (project: Project, apartment: Apartment) => {
  if (project.ownership_type.toLowerCase() === 'haso') {
    return (
      <div className={styles.price}>
        <span>
          {i18n.t(`${T_PATH}.rightOfOccupancyPayment`)}
          <span className={styles.emphasized}>
            {apartment.right_of_occupancy_payment ? formattedSalesPrice(apartment.right_of_occupancy_payment) : '-'}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className={styles.price}>
      <span>
        {i18n.t(`${T_PATH}.salesPrice`)}
        <span className={styles.emphasized}>
          {apartment.sales_price ? formattedSalesPrice(apartment.sales_price) : '-'}
        </span>
      </span>
      <span>
        {i18n.t(`${T_PATH}.debtFreeSalesPrice`)}
        <span className={styles.emphasized}>
          {apartment.debt_free_sales_price ? formattedSalesPrice(apartment.debt_free_sales_price) : '-'}
        </span>
      </span>
    </div>
  );
};

const InstallmentsItem = ({ apartment, project, reservationId, isCanceled }: IProps): JSX.Element | null => {
  const { t } = useTranslation();
  const openFormDialogButtonRef = useRef(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const {
    isOpen: isAccordionOpen,
    buttonProps: accordionButtonProps,
    contentProps: accordionContentProps,
  } = useAccordion({ initiallyOpen: false });
  const {
    data: reservation,
    isLoading,
    isFetching,
    isError,
    isSuccess,
    refetch,
  } = useGetApartmentReservationQuery(reservationId);
  const installments = reservation?.installments || [];
  const installmentCandidates = reservation?.installment_candidates || [];
  const accordionIcon = isAccordionOpen ? <IconAngleDown aria-hidden /> : <IconAngleRight aria-hidden />;

  const closeFormDialog = () => setIsFormDialogOpen(false);

  const handleFormCallBack = () => {
    closeFormDialog();
    refetch();
  };

  if (isLoading || isFetching) {
    return (
      <div className={styles.apartmentRow}>
        <span className="hiddenFromScreen">{t(`${T_PATH}.loading`)}...</span>
        <div className={styles.loadingPlaceholder}>
          <span className={styles.item} />
          <span className={styles.item} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.apartmentRow}>
        <Notification type="error" size="small" style={{ marginTop: 15 }}>
          {t(`${T_PATH}.errorLoadingInstallments`)}
        </Notification>
      </div>
    );
  }

  if (!isLoading && !isError && !isSuccess) return null;

  const targetPrice =
    project.ownership_type.toLowerCase() === 'haso' ? apartment.right_of_occupancy_payment : apartment.sales_price;

  const renderInstallmentsTable = () => {
    if (!!installments?.length) {
      return (
        <div {...accordionContentProps}>
          <InstallmentsTable
            installments={installments}
            reservationId={reservationId}
            targetPrice={targetPrice}
            apartment={apartment}
            project={project}
          />
        </div>
      );
    }
  };

  const renderApartmentRowActions = () => {
    if (!!installments?.length) {
      return (
        <>
          <Button
            variant="supplementary"
            size="small"
            iconLeft={<IconPenLine />}
            ref={openFormDialogButtonRef}
            onClick={() => setIsFormDialogOpen(true)}
          >
            {t(`${T_PATH}.editInstallments`)}
          </Button>
          <button
            className={cx(
              styles.toggleButton,
              'hds-button hds-button--secondary hds-button--theme-black hds-button--small'
            )}
            {...accordionButtonProps}
          >
            <span className={cx(styles.toggleButtonLabel, 'hds-button__label')}>
              <span className="hiddenFromScreen">
                {isAccordionOpen ? t(`${T_PATH}.closeAccordion`) : t(`${T_PATH}.openAccordion`)}
              </span>
              {accordionIcon}
            </span>
          </button>
        </>
      );
    }

    return (
      <Button variant="secondary" size="small" ref={openFormDialogButtonRef} onClick={() => setIsFormDialogOpen(true)}>
        {t(`${T_PATH}.createInstallments`)}
      </Button>
    );
  };

  const renderFormDialog = () => (
    <Dialog
      id="form-dialog"
      aria-labelledby="form-dialog-header"
      isOpen={isFormDialogOpen}
      close={closeFormDialog}
      closeButtonLabelText={t(`${T_PATH}.closeDialog`)}
      focusAfterCloseRef={openFormDialogButtonRef}
      className={styles.formDialog}
    >
      <Dialog.Header id="form-dialog-header" title={t(`${T_PATH}.installments`)} />
      <Dialog.Content>
        <div className={styles.formDialogProjectRow}>
          <ProjectName project={project} />
        </div>
        <div className={styles.formDialogApartmentRow}>
          {renderApartmentDetails(apartment)}
          {renderApartmentPrice(project, apartment)}
        </div>
        <div className={styles.formWrapper}>
          <InstallmentsForm
            handleFormCallback={handleFormCallBack}
            installments={installments}
            installmentCandidates={installmentCandidates}
            reservationId={reservationId}
            targetPrice={targetPrice}
          />
        </div>
      </Dialog.Content>
      <Dialog.ActionButtons>
        <Button form={`apartmentInstallmentForm-${reservationId}`} type="submit">
          {t(`${T_PATH}.save`)}
        </Button>
      </Dialog.ActionButtons>
    </Dialog>
  );

  return (
    <>
      <div className={styles.apartmentRow}>
        <div className={cx(styles.apartmentRowLeft, isCanceled && styles.disabled)}>
          {renderApartmentDetails(apartment)}
          <div>{renderApartmentPrice(project, apartment)}</div>
        </div>
        <div className={styles.apartmentRowRight}>{renderApartmentRowActions()}</div>
      </div>
      {renderInstallmentsTable()}
      {renderFormDialog()}
    </>
  );
};

export default InstallmentsItem;
