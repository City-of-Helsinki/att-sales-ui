import { useEffect } from 'react';
import { useGetApartmentReservationsQuery } from '../../redux/services/api';

interface ReservationsLoaderProps {
  apartmentUuid: string;
  onReservationsLoaded: (apartmentUuid: string, reservations: any[]) => void;
  allReservations: Record<string, any[]>;
}

const ReservationsLoader = ({ apartmentUuid, onReservationsLoaded, allReservations }: ReservationsLoaderProps) => {
  const { data: reservations } = useGetApartmentReservationsQuery(apartmentUuid, { skip: !apartmentUuid });

  useEffect(() => {
    if (!reservations) {
      onReservationsLoaded(apartmentUuid, []);
      return;
    }

    if (JSON.stringify(allReservations[apartmentUuid]) !== JSON.stringify(reservations)) {
      onReservationsLoaded(apartmentUuid, reservations);
    }
  }, [reservations, apartmentUuid, onReservationsLoaded, allReservations]);

  return null;
};

export default ReservationsLoader;
