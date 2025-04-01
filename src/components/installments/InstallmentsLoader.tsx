import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useGetApartmentReservationByIdQuery } from '../../redux/services/api';

interface InstallmentsLoaderProps {
  reservationId: number;
  onInstallmentsLoaded: (reservationId: number, installments: any[]) => void;
  allInstallments: Record<number, any[]>;
  delayMs?: number; // ⬅ добавили новое пропс
}

const InstallmentsLoader = ({
  reservationId,
  onInstallmentsLoaded,
  allInstallments,
  delayMs = 0,
}: InstallmentsLoaderProps) => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setEnabled(true);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  const { data: reservationData } = useGetApartmentReservationByIdQuery(reservationId, {
    skip: !reservationId || !enabled,
  });

  useEffect(() => {
    if (!reservationData?.installments || reservationData.installments.length === 0) return;

    if (!_.isEqual(allInstallments[reservationId], reservationData.installments)) {
      onInstallmentsLoaded(reservationId, reservationData.installments);
    }
  }, [reservationData, reservationId, onInstallmentsLoaded, allInstallments]);

  return null;
};

export default InstallmentsLoader;
