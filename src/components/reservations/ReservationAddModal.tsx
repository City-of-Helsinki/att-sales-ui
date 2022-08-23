import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, get } from 'react-hook-form';
import { Button, Dialog } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import formattedLivingArea from '../../utils/formatLivingArea';
import Label from '../common/label/Label';
import SelectCustomerDropdown from '../customers/SelectCustomerDropdown';
import { RootState } from '../../redux/store';
import { toast } from '../common/toast/ToastManager';
import { hideReservationAddModal } from '../../redux/features/reservationAddModalSlice';
import { ReservationAddFormData } from '../../types';
import { useCreateApartmentReservationMutation } from '../../redux/services/api';

import styles from './ReservationModal.module.scss';

const T_PATH = 'components.reservations.ReservationAddModal';

const ReservationAddModal = (): JSX.Element | null => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const reservationAddModal = useSelector((state: RootState) => state.reservationAddModal);
  const isDialogOpen = reservationAddModal.isOpened;
  const apartment = reservationAddModal.content?.apartment;
  const project = reservationAddModal.content?.project;
  const [isLoading, setIsLoading] = useState(false);
  const [createApartmentReservation, { isLoading: postCreateReservationLoading }] =
    useCreateApartmentReservationMutation();
  const schema = yup.object({
    apartment_uuid: yup.string().required(t(`${T_PATH}.apartmentRequired`)),
    customer_id: yup.string().required(t(`${T_PATH}.customerRequired`)),
  });
  const {
    handleSubmit,
    register,
    setValue,
    formState: { errors },
  } = useForm<ReservationAddFormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (apartment) {
      setValue('apartment_uuid', apartment.apartment_uuid);
    }
  }, [apartment, setValue]);

  const handleSelectCallback = (customerId: string) => {
    setValue('customer_id', customerId);
  };

  const closeDialog = () => dispatch(hideReservationAddModal());

  const handleFormSubmit = async (data: ReservationAddFormData) => {
    if (!postCreateReservationLoading) {
      setIsLoading(true);

      // Project uuid is used to refetch project data (including reservations) after creating a new reservation
      const projectId = project?.uuid || '';

      try {
        await createApartmentReservation({ formData: data, projectId: projectId })
          .unwrap()
          .then(() => {
            toast.show({ type: 'success', content: t(`${T_PATH}.createdSuccessfully`) });
            setIsLoading(false);
            closeDialog();
          });
      } catch (err: any) {
        toast.show({ type: 'error' });
        console.error(err);
        setIsLoading(false);
      }
    }
  };

  const onSubmit: SubmitHandler<ReservationAddFormData> = (data, event) => {
    event?.preventDefault();
    handleFormSubmit(data);
  };

  if (!isDialogOpen) return null;

  if (!project || !apartment) {
    toast.show({
      type: 'error',
      title: t(`${T_PATH}.errorTitle`),
      content: t(`${T_PATH}.noApartmentOrProject`),
    });

    return null;
  }

  const formId = `reservation-add-form-${apartment.apartment_uuid}`;

  return (
    <Dialog
      id={`reservation-add-dialog-${apartment.apartment_uuid}`}
      aria-labelledby="reservation-add-dialog-header"
      isOpen={isDialogOpen}
      close={closeDialog}
      closeButtonLabelText={t(`${T_PATH}.closeDialog`)}
      className={styles.reservationAddDialog}
      variant="primary"
    >
      <Dialog.Header id="reservation-add-dialog-header" title={t(`${T_PATH}.addApplicant`)} />
      <Dialog.Content>
        <div className={styles.details}>
          <div className={styles.projectHousingCompany}>
            <Label type={project.ownership_type}>{project.ownership_type}</Label>
          </div>
          <div>
            <div className={styles.title}>
              <h3>{project.housing_company}</h3>
              <span>
                <strong>{project.district}, </strong>
                {project.street_address}
              </span>
            </div>
            <div className={styles.apartment}>
              <strong>{apartment.apartment_number}</strong>
              <span>&mdash;</span>
              {apartment.apartment_structure}
              <span>&mdash;</span>
              {apartment.living_area && formattedLivingArea(apartment.living_area)}
            </div>
          </div>
        </div>
        <form id={formId} onSubmit={handleSubmit(onSubmit)}>
          <SelectCustomerDropdown
            handleSelectCallback={handleSelectCallback}
            errorMessage={get(errors, 'customer_id')?.message}
            hasError={Boolean(get(errors, 'customer_id'))}
          />
          <input {...register('customer_id')} readOnly hidden />
          <input {...register('apartment_uuid')} readOnly hidden />
        </form>
      </Dialog.Content>
      <Dialog.ActionButtons>
        <Button variant="primary" type="submit" form={formId} disabled={isLoading}>
          {t(`${T_PATH}.addBtn`)}
        </Button>
        <Button variant="secondary" onClick={() => closeDialog()}>
          {t(`${T_PATH}.cancelBtn`)}
        </Button>
      </Dialog.ActionButtons>
    </Dialog>
  );
};

export default ReservationAddModal;
