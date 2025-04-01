import { useEffect, useState } from 'react';
import { useGetApartmentReservationsQuery } from '../../redux/services/api';

interface ReservationsLoaderProps {
  apartmentUuid: string;
  onReservationsLoaded: (apartmentUuid: string, reservations: any[]) => void;
  allReservations: Record<string, any[]>;
  delayMs?: number;
}

const ReservationsLoader = ({
  apartmentUuid,
  onReservationsLoaded,
  allReservations,
  delayMs = 0,
}: ReservationsLoaderProps) => {
  const [enabled, setEnabled] = useState(delayMs === 0);

  useEffect(() => {
    if (delayMs > 0) {
      const timeout = setTimeout(() => setEnabled(true), delayMs);
      return () => clearTimeout(timeout);
    }
  }, [delayMs]);

  const { data: reservations } = useGetApartmentReservationsQuery(apartmentUuid, {
    skip: !apartmentUuid || !enabled,
  });

  useEffect(() => {
    if (!enabled) return;

    if (!reservations) {
      onReservationsLoaded(apartmentUuid, []);
      return;
    }

    if (JSON.stringify(allReservations[apartmentUuid]) !== JSON.stringify(reservations)) {
      onReservationsLoaded(apartmentUuid, reservations);
    }
  }, [reservations, apartmentUuid, enabled, onReservationsLoaded, allReservations]);

  return null;
};

export default ReservationsLoader;
