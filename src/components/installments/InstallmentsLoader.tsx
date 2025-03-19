import _ from 'lodash';
import { useEffect } from 'react';
import { useGetApartmentReservationByIdQuery } from '../../redux/services/api';

interface InstallmentsLoaderProps {
  reservationId: number;
  onInstallmentsLoaded: (reservationId: number, installments: any[]) => void;
  allInstallments: Record<number, any[]>;
}

const InstallmentsLoader = ({ reservationId, onInstallmentsLoaded, allInstallments }: InstallmentsLoaderProps) => {
  const { data: reservationData } = useGetApartmentReservationByIdQuery(reservationId, { skip: !reservationId });

  useEffect(() => {
    if (!reservationData?.installments || reservationData.installments.length === 0) return;

    if (!_.isEqual(allInstallments[reservationId], reservationData.installments)) {
      onInstallmentsLoaded(reservationId, reservationData.installments);
    }
  }, [reservationData, reservationId, onInstallmentsLoaded, allInstallments]);

  return null;
};

export default InstallmentsLoader;
