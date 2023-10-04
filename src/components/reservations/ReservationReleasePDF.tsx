import React, { useState } from 'react';
import { Button, IconDownload } from 'hds-react';
import { useTranslation } from 'react-i18next';

import { useGetCustomerByIdQuery } from '../../redux/services/api';
import { ApartmentReservation, Customer } from '../../types';
import { useDownloadFile } from '../../utils/useDownloadFile';
import { useFileDownloadApi } from '../../utils/useFileDownloadApi';
import { toast } from '../common/toast/ToastManager';

const T_PATH = 'components.reservations.ReservationReleasePDF';

interface Props {
  reservationId: ApartmentReservation['id'];
  customerId: Customer['id'];
  disabled?: boolean;
}

const ReservationReleasePDF = ({ reservationId, customerId, disabled = false }: Props): JSX.Element => {
  const { t: translate } = useTranslation();
  const t = (label: string) => translate(`${T_PATH}.${label}`);
  const [isLoadingRelease, setIsLoadingRelease] = useState<boolean>(false);

  // Non-essential, no need to wait for loading or check errors
  // Used as supplemental data to name the PDF file
  const { data: customer } = useGetCustomerByIdQuery(customerId.toString());

  const releaseApiUrl = `/apartment_reservations/${reservationId}/release_pdf/`;

  const preReleaseDownloading = () => setIsLoadingRelease(true);
  const postReleaseDownloading = () => setIsLoadingRelease(false);

  const onReleaseLoadError = () => {
    setIsLoadingRelease(false);
    toast.show({ type: 'error' });
  };

  const getReleaseFileName = (): string => {
    const reservation = customer?.apartment_reservations?.find((ar) => ar.id === reservationId);

    const projectName = reservation?.project_housing_company.replace(/\s/g, '-').toLocaleLowerCase();
    const apartmentNumber = reservation?.apartment_number.replace(/\s/g, '').toLocaleLowerCase();
    const identifier = projectName && apartmentNumber ? JSON.stringify(projectName + '_' + apartmentNumber) : '';

    // Example output: "luovutushintalaskelma_as-oy-project-x_a01_2022-01-01.pdf" (on Chrome)
    // Example output: "luovutushintalaskelma as-oy-project-x a01_2022-01-01.pdf" (on FF :-)
    return `luovutushintalaskelma${identifier}${new Date().toJSON().slice(0, 10)}.pdf`;
  };

  const {
    download,
    ref: fileRef,
    url: fileUrl,
    name: fileName,
  } = useDownloadFile({
    apiDefinition: useFileDownloadApi(releaseApiUrl),
    getFileName: getReleaseFileName,
    onError: onReleaseLoadError,
    postDownloading: postReleaseDownloading,
    preDownloading: preReleaseDownloading,
  });

  return (
    <>
      <Button
        variant={'primary'}
        onClick={download}
        disabled={isLoadingRelease || disabled}
        iconRight={<IconDownload />}
      >
        {t('download')}
      </Button>
      <a href={fileUrl} download={fileName} className="hiddenFromScreen" ref={fileRef}>
        {t('download')}
      </a>
    </>
  );
};

export default ReservationReleasePDF;
