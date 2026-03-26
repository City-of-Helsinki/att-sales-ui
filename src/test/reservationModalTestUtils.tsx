import React from 'react';

import ReservationAddModal from '../components/reservations/ReservationAddModal';
import ReservationEditModal from '../components/reservations/ReservationEditModal';
import type { Apartment, ApartmentReservationWithCustomer, Project } from '../types';
import { renderWithProviders } from './test-utils';

type TokenState = {
  tokens: { apiToken: string };
};

export function renderReservationEditModalOpened(params: {
  reservation: ApartmentReservationWithCustomer;
  projectId: string;
  apartmentId: string;
}) {
  const { reservation, projectId, apartmentId } = params;
  return renderWithProviders(<ReservationEditModal />, {
    preloadedState: {
      ...({ tokens: { apiToken: 'test-token' } } as TokenState),
      reservationEditModal: {
        isOpened: true,
        content: {
          reservation,
          projectId,
          apartmentId,
        },
      },
    },
  });
}

export function renderReservationAddModalOpened(params: { apartment: Apartment; project: Project }) {
  const { apartment, project } = params;
  return renderWithProviders(<ReservationAddModal />, {
    preloadedState: {
      ...({ tokens: { apiToken: 'test-token' } } as TokenState),
      reservationAddModal: {
        isOpened: true,
        content: { apartment, project },
      },
    },
  });
}
