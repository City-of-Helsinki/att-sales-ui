import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import getApiBaseUrl from '../../utils/getApiBaseUrl';
import {
  AddEditCostIndex,
  AddEditCustomerFormFields,
  Apartment,
  ApartmentInstallment,
  ApartmentReservationWithCustomer,
  ApartmentReservationWithInstallments,
  CostIndex,
  Customer,
  CustomerListItem,
  Project,
  ProjectExtraData,
  ProjectOfferMessageFormData,
  ProjectInstallment,
  ReservationAddFormData,
  ReservationCancelFormData,
  ReservationEditFormData,
  OfferFormData,
  Offer,
  OfferMessage,
  ApartmentHASOPayment,
  ApartmentRevaluation,
} from '../../types';
import type { RootState } from '../store';
import { InstallmentTypes } from '../../enums';

const InstallmentTypeKeys = Object.keys(InstallmentTypes);

// Define a service using a base URL and expected endpoints
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: getApiBaseUrl(),
    prepareHeaders: (headers, { getState }) => {
      headers.set('Content-Type', 'application/json');

      const apiToken = (getState() as RootState).tokens.apiToken;

      if (apiToken) {
        headers.append('authorization', `Bearer ${apiToken}`);
      } else {
        throw new Error('No API token');
      }

      return headers;
    },
  }),
  tagTypes: [
    'ApartmentReservations',
    'ApartmentHASOPayment',
    'ApartmentRevaluation',
    'CostIndex',
    'Customer',
    'Offer',
    'OfferMessage',
    'Project',
    'ProjectExtraData',
    'Reservation',
  ],
  endpoints: (builder) => ({
    // GET: Fetch all projects
    getProjects: builder.query<Project[], void>({
      query: () => 'projects/',
    }),

    // GET: Fetch single project by project uuid
    getProjectById: builder.query<Project, string>({
      query: (id) => `projects/${id}/`,
      providesTags: (result, error, arg) => [{ type: 'Project', id: arg }],
    }),

    // GET: Fetch apartments for a single project by project uuid
    getApartmentsByProject: builder.query<Apartment[], string>({
      query: (id) => `apartments/?project_uuid=${id}`,
    }),

    // POST: Start lottery for a project
    startLotteryForProject: builder.mutation<any, {}>({
      query: (params) => ({
        url: 'execute_lottery_for_project/',
        method: 'POST',
        body: params,
      }),
    }),

    // GET: List CostIndexTable values
    getCostIndexes: builder.query<CostIndex[], void>({
      query: () => 'cost_indexes/',
      providesTags: [{ type: 'CostIndex', id: 'LIST' }],
    }),

    // POST: Add CostIndexTable
    addCostIndex: builder.mutation<any, { formData: AddEditCostIndex }>({
      query: (params) => {
        return {
          url: 'cost_indexes/',
          method: 'POST',
          body: params.formData,
        };
      },
      invalidatesTags: (result, error, arg) => [{ type: 'CostIndex', id: 'LIST' }],
    }),

    // GET: Fetch apartment HASO payment
    getApartmentHASOPayment: builder.query<ApartmentHASOPayment, string>({
      query: (apartment_uuid) => `apartment/${apartment_uuid}/haso_payment/`,
      providesTags: (result, error, arg) => [{ type: 'ApartmentHASOPayment', id: arg }],
    }),

    // POST: Create HASO apartment revaluation
    addApartmentRevaluation: builder.mutation<any, { formData: ApartmentRevaluation; apartmentId: string }>({
      query: (params) => {
        return {
          url: 'apartment/revaluations/',
          method: 'POST',
          body: params.formData,
        };
      },
      invalidatesTags: (result, error, arg) => [
        { type: 'ApartmentRevaluation', id: 'LIST' },
        { type: 'ApartmentReservations', id: arg.apartmentId },
        { type: 'ApartmentHASOPayment', id: arg.apartmentId },
      ],
    }),

    updateApartmentRevaluation: builder.mutation<
      any,
      { formData: ApartmentRevaluation; id: number; apartmentId: string }
    >({
      query: (params) => {
        return {
          url: `apartment/revaluations/${params.id}/`,
          method: 'PUT',
          body: params.formData,
        };
      },
      invalidatesTags: (result, error, arg) => [
        { type: 'ApartmentRevaluation', id: arg.id },
        { type: 'ApartmentReservations', id: arg.apartmentId },
        { type: 'ApartmentHASOPayment', id: arg.apartmentId },
      ],
    }),

    // GET: Search for customers with search params
    getCustomers: builder.query<CustomerListItem[], string>({
      query: (params) => `customers/?${params}`,
      providesTags: [{ type: 'Customer', id: 'LIST' }],
    }),

    // GET: Fetch single customer's details
    getCustomerById: builder.query<Customer, string>({
      query: (id) => `customers/${id}/`,
      providesTags: (result, error, arg) => [{ type: 'Customer', id: arg }],
    }),

    // POST: Create a new customer
    createCustomer: builder.mutation<Customer, { formData: Partial<AddEditCustomerFormFields> }>({
      query: (params) => {
        return {
          url: `customers/`,
          method: 'POST',
          body: params.formData,
        };
      },
      invalidatesTags: ['Customer'],
    }),

    // PUT: Update customer details
    updateCustomerById: builder.mutation<Customer, { formData: Partial<AddEditCustomerFormFields>; id: string }>({
      query: (params) => {
        return {
          url: `customers/${params.id}/`,
          method: 'PUT',
          body: params.formData,
        };
      },
      invalidatesTags: (result, error, arg) => [{ type: 'Customer', id: arg.id }],
    }),

    // GET: Fetch saved installments for a project
    getProjectInstallments: builder.query<ProjectInstallment[], string>({
      query: (id) => `projects/${id}/installment_templates/`,
    }),

    // POST: Set project installments
    setProjectInstallments: builder.mutation<any, { formData: Partial<ProjectInstallment>[]; uuid: string }>({
      query: (params) => {
        return {
          url: `projects/${params.uuid}/installment_templates/`,
          method: 'POST',
          body: params.formData,
        };
      },
    }),

    // GET: Fetch saved extra data for a project
    getProjectExtraData: builder.query<ProjectExtraData, string>({
      query: (id) => `projects/${id}/extra_data/`,
      providesTags: (result, error, arg) => [{ type: 'ProjectExtraData', id: arg }],
    }),

    // PATCH: Partially update project extra data
    partialUpdateProjectExtraData: builder.mutation<
      any,
      { formData: Partial<ProjectOfferMessageFormData>; uuid: string }
    >({
      query: (params) => {
        return {
          url: `projects/${params.uuid}/extra_data/`,
          method: 'PATCH',
          body: params.formData,
        };
      },
      invalidatesTags: (result, error, arg) => [{ type: 'ProjectExtraData', id: arg.uuid }, { type: 'OfferMessage' }],
    }),

    // GET: Fetch all reservations for a specific apartment
    getApartmentReservations: builder.query<ApartmentReservationWithCustomer[], string>({
      query: (apartmentId) => `apartments/${apartmentId}/reservations/`,
      providesTags: (result, error, arg) => [{ type: 'ApartmentReservations', id: arg }],
    }),

    // GET: Fetch single apartment reservation that includes installments
    getApartmentReservationById: builder.query<ApartmentReservationWithInstallments, number>({
      query: (id) => `apartment_reservations/${id}/`,
      providesTags: (result, error, arg) => [{ type: 'Reservation', id: arg }],
    }),

    // POST: Create new apartment reservation
    createApartmentReservation: builder.mutation<
      any,
      { formData: ReservationAddFormData; projectId: string; apartmentId: string }
    >({
      query: (params) => {
        return {
          url: `apartment_reservations/`,
          method: 'POST',
          body: params.formData,
        };
      },
      invalidatesTags: (result, error, arg) => [
        { type: 'ApartmentReservations', id: arg.apartmentId },
        { type: 'Project', id: arg.projectId },
        { type: 'Customer', id: arg.formData.customer_id },
      ],
    }),

    // POST: Set apartment reservation state
    setApartmentReservationState: builder.mutation<
      any,
      { formData: ReservationEditFormData; reservationId: number; projectId: string; apartmentId: string }
    >({
      query: (params) => {
        return {
          url: `apartment_reservations/${params.reservationId}/set_state/`,
          method: 'POST',
          body: params.formData,
        };
      },
      invalidatesTags: (result, error, arg) => [
        { type: 'ApartmentReservations', id: arg.apartmentId },
        { type: 'Project', id: arg.projectId },
        { type: 'Reservation', id: arg.reservationId },
      ],
    }),

    // POST: Cancel apartment reservation
    cancelApartmentReservation: builder.mutation<
      any,
      {
        formData: ReservationCancelFormData;
        reservationId: number;
        projectId: string;
        customerId: number;
        apartmentId: string;
      }
    >({
      query: (params) => {
        return {
          url: `apartment_reservations/${params.reservationId}/cancel/`,
          method: 'POST',
          body: params.formData,
        };
      },
      invalidatesTags: (result, error, arg) => [
        { type: 'ApartmentReservations', id: arg.apartmentId },
        { type: 'Project', id: arg.projectId },
        { type: 'Reservation', id: arg.reservationId },
        { type: 'Customer', id: arg.customerId },
      ],
    }),

    // POST: Set apartment installments for a reservation
    setApartmentInstallments: builder.mutation<any, { formData: Partial<ApartmentInstallment>[]; id: number }>({
      query: (params) => {
        return {
          url: `apartment_reservations/${params.id}/installments/`,
          method: 'POST',
          body: params.formData,
        };
      },
    }),

    // POST: Send apartment installments to SAP
    sendApartmentInstallmentsToSAP: builder.mutation<any, { types: typeof InstallmentTypeKeys; id: number }>({
      query: (params) => {
        const types = params.types.toString();
        return {
          url: `apartment_reservations/${params.id}/installments/add_to_be_sent_to_sap/?types=${types}`,
          method: 'POST',
        };
      },
      invalidatesTags: (result, error, arg) => [{ type: 'Reservation', id: arg.id }],
    }),

    // GET: Fetch single offer
    getOfferById: builder.query<Offer, number>({
      query: (id) => `offers/${id}/`,
      providesTags: (result, error, arg) => [{ type: 'Offer', id: arg }],
    }),

    // POST: Create new offer
    createOffer: builder.mutation<
      Offer,
      { formData: OfferFormData; reservationId: number; projectId: string; customerId: number; apartmentId: string }
    >({
      query: (params) => {
        return {
          url: `offers/`,
          method: 'POST',
          body: params.formData,
        };
      },
      invalidatesTags: (result, error, arg) => [
        { type: 'ApartmentReservations', id: arg.apartmentId },
        { type: 'Customer', id: arg.customerId },
        { type: 'Reservation', id: arg.reservationId },
        { type: 'Project', id: arg.projectId },
      ],
    }),

    // PUT: Update offer
    updateOfferById: builder.mutation<
      Offer,
      {
        formData: OfferFormData;
        offerId: number;
        reservationId: number;
        projectId: string;
        customerId: number;
        apartmentId: string;
      }
    >({
      query: (params) => {
        return {
          url: `offers/${params.offerId}/`,
          method: 'PUT',
          body: params.formData,
        };
      },
      invalidatesTags: (result, error, arg) => [
        { type: 'ApartmentReservations', id: arg.apartmentId },
        { type: 'Customer', id: arg.customerId },
        { type: 'Offer', id: arg.offerId },
        { type: 'Project', id: arg.projectId },
        { type: 'Reservation', id: arg.reservationId },
      ],
    }),

    // GET: Fetch offer email message
    getOfferMessage: builder.query<OfferMessage, { id: number; valid_until: string }>({
      query: (params) => `apartment_reservations/${params.id}/offer_message/?valid_until=${params.valid_until}`,
      providesTags: [{ type: 'OfferMessage' }],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useGetApartmentsByProjectQuery,
  useStartLotteryForProjectMutation,
  useGetProjectInstallmentsQuery,
  useSetProjectInstallmentsMutation,
  useGetProjectExtraDataQuery,
  usePartialUpdateProjectExtraDataMutation,
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerByIdMutation,
  useCreateApartmentReservationMutation,
  useGetApartmentReservationsQuery,
  useGetApartmentReservationByIdQuery,
  useSetApartmentReservationStateMutation,
  useCancelApartmentReservationMutation,
  useSetApartmentInstallmentsMutation,
  useSendApartmentInstallmentsToSAPMutation,
  useGetOfferByIdQuery,
  useCreateOfferMutation,
  useUpdateOfferByIdMutation,
  useGetOfferMessageQuery,
  useGetCostIndexesQuery,
  useAddCostIndexMutation,
  useGetApartmentHASOPaymentQuery,
  useAddApartmentRevaluationMutation,
  useUpdateApartmentRevaluationMutation,
} = api;
