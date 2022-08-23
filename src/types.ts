import {
  ApartmentReservationStates,
  ApartmentState,
  InstallmentPercentageSpecifiers,
  InstallmentTypes,
  OfferState,
  ReservationCancelReasons,
  StateOfSale,
} from './enums';

export type AnyObject = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/ban-types
export type AnyNonNullishValue = {};
export type AnyValue = AnyNonNullishValue | undefined | null;
export type AnyFunction = (props?: unknown) => unknown;

export type Apartment = {
  _language: string;
  additional_information: string;
  apartment_address: string;
  apartment_holding_type: string;
  apartment_number: string;
  apartment_state: string;
  apartment_state_of_sale: string;
  apartment_structure: string;
  apartment_uuid: string;
  application_url: string;
  balcony_description: string;
  bathroom_appliances: string;
  condition: number;
  debt_free_sales_price: number;
  financing_fee: number;
  floor: number;
  floor_max: number;
  has_apartment_sauna: boolean;
  has_balcony: boolean;
  has_terrace: boolean;
  has_yard: boolean;
  housing_company_fee: number;
  kitchen_appliances: string;
  living_area: number;
  loan_share: number;
  maintenance_fee: number;
  nid: number;
  other_fees: number;
  parking_fee: number;
  parking_fee_explanation: string;
  price_m2: number;
  project_id: number;
  reservations: ApartmentReservationWithCustomer[];
  right_of_occupancy_payment: number;
  room_count: number;
  sales_price: number;
  services: string[];
  services_description: string;
  showing_times: string[];
  site_owner: string;
  state: `${ApartmentState}`;
  storage_description: string;
  title: string;
  url: string;
  uuid: string;
  view_description: string;
  water_fee: number;
  water_fee_explanation: string;
};

export type Project = {
  acc_financeofficer: string;
  acc_salesperson: string;
  apartment_count: number;
  apartments: Apartment[];
  application_count: number;
  application_end_time: string;
  application_start_time: string;
  archived: boolean;
  attachment_urls: string[];
  barred_bank_account: string;
  building_type: string;
  city: string;
  construction_materials: string[];
  constructor: string;
  coordinate_lat: number;
  coordinate_lon: number;
  description?: string;
  district: string;
  energy_class: string;
  estate_agent: string;
  estate_agent_email: string;
  estate_agent_phone: string;
  estimated_completion: string;
  estimated_completion_date: string;
  has_elevator: boolean;
  has_sauna: boolean;
  heating_options: string[];
  holding_type: string;
  housing_company: string;
  housing_manager: string;
  id: number;
  image_urls: string[];
  lottery_completed_at: string;
  main_image_url: string;
  manager: string;
  material_choice_dl: string;
  new_development_status: string;
  new_housing: boolean;
  ownership_type: string;
  possession_transfer_date: string;
  postal_code: string;
  premarketing_end_time: string;
  premarketing_start_time: string;
  publication_end_time: string;
  publication_start_time: string;
  published: boolean;
  realty_id: string;
  regular_bank_account: string;
  roof_material: string;
  sanitation: string;
  shareholder_meeting_date: string;
  site_area: number;
  site_renter: string;
  state_of_sale: StateOfSale;
  street_address: string;
  url: string;
  uuid: string;
  virtual_presentation_url: string;
  zoning_info: string;
  zoning_status: string;
};

export type CustomerProfile = {
  city?: string;
  contact_language?: 'en' | 'fi' | 'sv';
  date_of_birth: string;
  email: string;
  first_name: string;
  id: string;
  last_name: string;
  national_identification_number?: string;
  phone_number: string;
  postal_code?: string;
  street_address?: string;
};

export type Customer = {
  additional_information: string;
  created_at: string;
  has_children?: boolean;
  has_hitas_ownership?: boolean;
  id: number;
  is_age_over_55?: boolean;
  is_right_of_occupancy_housing_changer?: boolean;
  last_contact_date?: string;
  primary_profile: CustomerProfile;
  right_of_residence?: number;
  secondary_profile?: CustomerProfile;
  apartment_reservations?: CustomerReservation[];
};

export type CustomerListItem = {
  id: number;
  primary_first_name: string;
  primary_last_name: string;
  primary_email: string;
  primary_phone_number: string;
  secondary_first_name?: string;
  secondary_last_name?: string;
};

export type ApartmentInstallment = {
  type: `${InstallmentTypes}`;
  amount: number;
  account_number: string;
  due_date: string | null;
  reference_number?: string;
  added_to_be_sent_to_sap_at?: string;
};

export type ApartmentInstallmentCandidate = Omit<
  ApartmentInstallment,
  'reference_number' | 'added_to_be_sent_to_sap_at'
>;

export type ApartmentInstallmentInputRow = {
  type: string;
  amount: string;
  due_date: string;
  account_number: string;
  reference_number: string;
  added_to_be_sent_to_sap_at: string;
};

export type ProjectInstallment = {
  type: `${InstallmentTypes}`;
  amount?: number;
  percentage?: string;
  percentage_specifier?: `${InstallmentPercentageSpecifiers}`;
  account_number: string;
  due_date: string | null;
};

export type ProjectInstallmentInputRow = {
  type: string;
  unit: string;
  sum: string;
  percentage_specifier: string;
  account_number: string;
  due_date: string;
};

export type ProjectExtraData = {
  offer_message_intro: string;
  offer_message_content: string;
};

export type ApartmentReservationCustomer = {
  id: Customer['id'];
  primary_profile: Pick<CustomerProfile, 'first_name' | 'last_name' | 'email'>;
  secondary_profile?: Pick<CustomerProfile, 'first_name' | 'last_name' | 'email'>;
};

export type ApartmentReservation = {
  apartment_uuid: Apartment['uuid'];
  cancellation_reason?: `${ReservationCancelReasons}`;
  cancellation_timestamp?: string;
  id: number;
  lottery_position?: number;
  offer?: ApartmentReservationOffer;
  priority_number?: number;
  queue_position?: number;
  state: `${ApartmentReservationStates}`;
};

export type ApartmentReservationWithCustomer = ApartmentReservation & {
  customer: ApartmentReservationCustomer;
  has_children?: Customer['has_children'];
  has_multiple_winning_apartments: boolean;
  right_of_residence?: Customer['right_of_residence'];
  has_hitas_ownership?: Customer['has_hitas_ownership'];
  is_age_over_55?: Customer['is_age_over_55'];
  is_right_of_occupancy_housing_changer?: Customer['is_right_of_occupancy_housing_changer'];
};

export type ApartmentReservationWithInstallments = ApartmentReservation & {
  installment_candidates: ApartmentInstallmentCandidate[];
  installments: ApartmentInstallment[];
};

export type ReservationStateChangeUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
};

export type ReservationStateChangeEvent = {
  timestamp: string;
  state: `${ApartmentReservationStates}`;
  comment: string;
  cancellation_reason?: `${ReservationCancelReasons}`;
  changed_by?: ReservationStateChangeUser;
};

export type CustomerReservation = {
  apartment_debt_free_sales_price?: Apartment['debt_free_sales_price'];
  apartment_installments?: ApartmentInstallment[];
  apartment_living_area: Apartment['living_area'];
  apartment_number: Apartment['apartment_number'];
  apartment_right_of_occupancy_payment?: Apartment['right_of_occupancy_payment'];
  apartment_sales_price?: Apartment['sales_price'];
  apartment_structure: Apartment['apartment_structure'];
  apartment_uuid: Apartment['uuid'];
  has_children?: Customer['has_children'];
  has_hitas_ownership?: Customer['has_hitas_ownership'];
  id: number;
  is_age_over_55?: Customer['is_age_over_55'];
  is_right_of_occupancy_housing_changer?: Customer['is_right_of_occupancy_housing_changer'];
  lottery_position?: number;
  offer?: ApartmentReservationOffer;
  priority_number?: number;
  project_district: Project['district'];
  project_housing_company: Project['housing_company'];
  project_lottery_completed: boolean;
  project_ownership_type: Project['ownership_type'];
  project_street_address: Project['street_address'];
  project_uuid: Project['uuid'];
  queue_position?: number;
  right_of_residence?: Customer['right_of_residence'];
  state: `${ApartmentReservationStates}`;
  state_change_events?: ReservationStateChangeEvent[];
};

export type SelectOption = {
  label: string;
  name: string;
  selectValue: string;
  disabled?: boolean;
};

export type CustomerSearchFormFields = {
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
};

export type AddEditCustomerFormFields = {
  additional_information: string;
  created_at: string;
  has_children: boolean | null;
  has_hitas_ownership: boolean | null;
  has_secondary_profile: boolean;
  is_age_over_55: boolean | null;
  is_right_of_occupancy_housing_changer: boolean | null;
  last_contact_date: string | null;
  primary_profile: Omit<CustomerProfile, 'id'>;
  right_of_residence: number | null;
  secondary_profile: Omit<CustomerProfile, 'id'> | null;
};

export type ReservationEditFormData = {
  state: `${ApartmentReservationStates}`;
  comment: string;
};

export type ReservationCancelFormData = {
  cancellation_reason: string;
  comment: string;
  new_customer_id?: string;
};

export type ReservationAddFormData = {
  apartment_uuid: string;
  customer_id: string;
};

export type Offer = {
  id: number;
  created_at: string;
  apartment_reservation_id: ApartmentReservation['id'];
  valid_until: string;
  state: `${OfferState}`;
  concluded_at: string;
  comment?: string;
  is_expired?: boolean;
};

export type ApartmentReservationOffer = Omit<Offer, 'apartment_reservation_id'>;

export type ProjectOfferMessageFormData = Pick<ProjectExtraData, 'offer_message_intro' | 'offer_message_content'>;

export type OfferModalReservationData = Pick<
  ApartmentReservationWithCustomer,
  | 'has_children'
  | 'id'
  | 'offer'
  | 'right_of_residence'
  | 'has_hitas_ownership'
  | 'is_age_over_55'
  | 'is_right_of_occupancy_housing_changer'
>;

export type OfferFormData = {
  apartment_reservation_id: Offer['apartment_reservation_id'];
  valid_until: Offer['valid_until'];
  state: Offer['state'];
  comment?: Offer['comment'];
};

export type OfferMessageRecipient = {
  name: string;
  email: string;
};

export type OfferMessage = {
  subject: string;
  body: string;
  recipients: OfferMessageRecipient[];
};
