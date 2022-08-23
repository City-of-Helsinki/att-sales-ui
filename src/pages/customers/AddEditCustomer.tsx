import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import moment from 'moment';
import { Button, Checkbox, Notification, PhoneInput, Select, TextArea, TextInput } from 'hds-react';
import { Controller, useForm, SubmitHandler, get } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { omit } from 'lodash';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import Breadcrumbs, { BreadcrumbItem } from '../../components/common/breadcrumbs/Breadcrumbs';
import Container from '../../components/common/container/Container';
import Spinner from '../../components/common/spinner/Spinner';
import formatDateTime from '../../utils/formatDateTime';
import { AddEditCustomerFormFields, Customer, SelectOption } from '../../types';
import { ROUTES } from '../../enums';
import { toast } from '../../components/common/toast/ToastManager';
import { usePageTitle } from '../../utils/usePageTitle';
import {
  useCreateCustomerMutation,
  useGetCustomerByIdQuery,
  useUpdateCustomerByIdMutation,
} from '../../redux/services/api';

import styles from './AddEditCustomer.module.scss';

const T_PATH = 'pages.customers.AddEditCustomer';

const langCodes = ['fi', 'en', 'sv'];
const langCodesAsConst = ['fi', 'en', 'sv'] as const;
type LangCode = typeof langCodesAsConst[number];

interface IProps {
  isEditMode: boolean;
}

const AddEditCustomer = ({ isEditMode }: IProps) => {
  const { t } = useTranslation();
  const { customerId } = useParams();
  const {
    data: customer,
    isLoading: isCustomerLoading,
    isError: isCustomerError,
  } = useGetCustomerByIdQuery(customerId || '0', { skip: !isEditMode });
  const [createCustomer, { isLoading: isCreateCustomerLoading }] = useCreateCustomerMutation();
  const [updateCustomerById, { isLoading: isUpdateCustomerLoading }] = useUpdateCustomerByIdMutation();
  const [errorMessages, setErrorMessages] = useState([]);
  const navigate = useNavigate();

  usePageTitle(isEditMode ? t('PAGES.customerEdit') : t('PAGES.customerAdd'));

  const requiredString = () => yup.string().required(t(`${T_PATH}.required`));
  const profileSchema = () =>
    yup.object({
      city: requiredString(),
      contact_language: yup
        .string()
        .oneOf(langCodes)
        .required(t(`${T_PATH}.required`)),
      date_of_birth: requiredString().test('is-proper-date-format', t(`${T_PATH}.useValidDateFormat`), (val) => {
        return moment(val, 'D.M.YYYY', true).isValid();
      }),
      email: yup
        .string()
        .email()
        .required(t(`${T_PATH}.required`)),
      first_name: requiredString(),
      last_name: requiredString(),
      national_identification_number: yup.string().nullable(),
      phone_number: requiredString(),
      postal_code: requiredString(),
      street_address: requiredString(),
    });

  const schema = yup
    .object({
      additional_information: yup.string().nullable(),
      has_children: yup.boolean().nullable(),
      has_hitas_ownership: yup.boolean().nullable(),
      has_secondary_profile: yup.boolean(),
      is_age_over_55: yup.boolean().nullable(),
      is_right_of_occupancy_housing_changer: yup.boolean().nullable(),
      last_contact_date: yup
        .string()
        .nullable()
        .transform((val, originalVal) => (originalVal === '' ? null : val))
        .test('is-proper-date-format', t(`${T_PATH}.useValidDateFormat`), (val) => {
          return val === null ? true : moment(val, 'D.M.YYYY', true).isValid();
        }),
      right_of_residence: yup
        .number()
        .nullable()
        .transform((val, originalVal) => (originalVal === '' ? null : val)),
      primary_profile: profileSchema().required(),
      secondary_profile: yup
        .object()
        .when('has_secondary_profile', {
          is: true,
          then: profileSchema(),
        })
        .nullable(),
    })
    .required();

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AddEditCustomerFormFields>({
    resolver: yupResolver(schema),
  });

  const hasSecondaryProfile = watch('has_secondary_profile');

  const formatDateForApi = (val: string) => {
    return moment(val, 'D.M.YYYY').format('YYYY-MM-DD');
  };

  const formatDateForInput = (val: string) => {
    return moment(val, 'YYYY-MM-DD').format('D.M.YYYY');
  };

  const onSubmit: SubmitHandler<AddEditCustomerFormFields> = (data) => {
    const formData = { ...data };

    // Convert visible dates into correct API format
    if (formData.primary_profile.date_of_birth) {
      formData.primary_profile.date_of_birth = formatDateForApi(formData.primary_profile.date_of_birth);
    }
    if (formData.secondary_profile?.date_of_birth) {
      formData.secondary_profile.date_of_birth = formatDateForApi(formData.secondary_profile.date_of_birth);
    }
    if (formData.last_contact_date) {
      formData.last_contact_date = formatDateForApi(formData.last_contact_date);
    }

    // Set secondary profile as null if 'has_secondary_profile' checkbox is unchecked
    if (!formData.has_secondary_profile) {
      formData.secondary_profile = null;
    }

    const apiData = omit(formData, 'created_at', 'has_secondary_profile');

    return isEditMode ? updateCustomer(apiData, customerId) : addCustomer(apiData);
  };

  const handleApiErrors = (err: any) => {
    const errorCode = err.status;
    const errorData = err.data;

    let apiErrors: any = [];

    if (errorData.message) {
      apiErrors.push(errorData.message);
    } else {
      apiErrors.push(`${errorCode} - Error`);
    }

    Object.entries(errorData).forEach(([key, val]) => {
      const value = val as any;
      if (Array.isArray(value)) {
        apiErrors.push(`${key}: ${value[0].message}`);
      } else {
        Object.entries(value).forEach(([key2, val2]) => {
          if (Array.isArray(val2)) {
            apiErrors.push(`${key2}: ${val2[0].message}`);
          }
        });
      }
    });

    setErrorMessages(apiErrors);
  };

  const addCustomer = async (data: Partial<AddEditCustomerFormFields>) => {
    if (!isCreateCustomerLoading) {
      try {
        // Send form data to API
        await createCustomer({ formData: data })
          .unwrap()
          .then((payload: Customer) => {
            // Clear any error messages
            setErrorMessages([]);
            // Show success toast
            toast.show({ type: 'success', content: t(`${T_PATH}.formSentSuccessfully`) });
            // Navigate to created customer profile
            navigate(`/${ROUTES.CUSTOMERS}/${payload.id}`);
          });
      } catch (err: any) {
        // Catch error data
        handleApiErrors(err);
      }
    }
  };

  const updateCustomer = async (data: Partial<AddEditCustomerFormFields>, id?: string) => {
    if (!isUpdateCustomerLoading && id) {
      try {
        // Send form data to API
        await updateCustomerById({ formData: data, id })
          .unwrap()
          .then(() => {
            // Clear any error messages
            setErrorMessages([]);
            // Show success toast
            toast.show({ type: 'success', content: t(`${T_PATH}.formSentSuccessfully`) });
            // Navigate back to customer profile
            navigate(`/${ROUTES.CUSTOMERS}/${customerId}`);
          });
      } catch (err: any) {
        // Catch error data
        handleApiErrors(err);
      }
    }
  };

  // Fill form fields with customer data when in edit mode
  useEffect(() => {
    if (isEditMode && customer) {
      // Omit apartment_reservations, customer ID and profile IDs from the customer
      const omittedCustomer = omit(
        customer,
        'id',
        'apartment_reservations',
        'primary_profile.id',
        'secondary_profile.id'
      );

      // Convert visible dates into correct format
      if (omittedCustomer.primary_profile.date_of_birth) {
        omittedCustomer.primary_profile.date_of_birth = formatDateForInput(
          omittedCustomer.primary_profile.date_of_birth
        );
      }
      if (omittedCustomer.secondary_profile?.date_of_birth) {
        omittedCustomer.secondary_profile.date_of_birth = formatDateForInput(
          omittedCustomer.secondary_profile.date_of_birth
        );
      }
      if (omittedCustomer.last_contact_date) {
        omittedCustomer.last_contact_date = formatDateForInput(omittedCustomer.last_contact_date);
      }
      if (omittedCustomer.created_at) {
        omittedCustomer.created_at = formatDateTime(omittedCustomer.created_at);
      }

      // Reset form fields initial data to be customer data
      reset({ ...omittedCustomer, has_secondary_profile: omittedCustomer.secondary_profile !== null });
    }
  }, [isEditMode, customer, reset]);

  const breadcrumbAncestors = (): BreadcrumbItem[] => {
    let ancestors = [
      {
        label: t(`${T_PATH}.customers`),
        path: `/${ROUTES.CUSTOMERS}`,
      },
    ];
    if (isEditMode && customerId) {
      ancestors.push({
        label: customerId,
        path: `/${ROUTES.CUSTOMERS}/${customerId}`,
      });
    }
    return ancestors;
  };

  const currentBreadcrumb = isEditMode ? t(`${T_PATH}.editUser`) : t(`${T_PATH}.createUser`);

  const renderBreadcrumb = () => <Breadcrumbs current={currentBreadcrumb} ancestors={breadcrumbAncestors()} />;

  const contactLanguageOptions: SelectOption[] = [
    { label: 'Suomi', name: 'contact_lang', selectValue: 'fi' },
    { label: 'English', name: 'contact_lang', selectValue: 'en' },
    { label: 'Svenska', name: 'contact_lang', selectValue: 'sv' },
  ];

  const getContactLanguageOption = (value: string) => {
    if (value === '') return null;
    return contactLanguageOptions.find((option) => option.selectValue === value);
  };

  if (isEditMode && isCustomerLoading) {
    return (
      <Container>
        {renderBreadcrumb()}
        <Spinner />
      </Container>
    );
  }

  if (isEditMode && isCustomerError) {
    return (
      <Container>
        {renderBreadcrumb()}
        <Notification type="error" size="small" style={{ marginTop: 15 }}>
          {t(`${T_PATH}.errorLoadingCustomer`)}
        </Notification>
      </Container>
    );
  }

  return (
    <>
      <Container>
        {renderBreadcrumb()}
        <h1 className={styles.columnHeader}>{isEditMode ? t(`${T_PATH}.editUser`) : t(`${T_PATH}.createUser`)}</h1>
        {!!errorMessages.length && (
          <Notification label={t(`${T_PATH}.error`)} type="error" style={{ margin: '15px 0' }}>
            <ul style={{ margin: 0 }}>
              {errorMessages.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Notification>
        )}
      </Container>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Container wide>
          <div className={cx(styles.section, styles.fieldWrapper)}>
            <h2>{t(`${T_PATH}.mainApplicant`)}</h2>
            <div className={styles.row}>
              <div className={styles.column} style={{ flexBasis: '50%' }}>
                <h3>{t(`${T_PATH}.customerPersonalInfo`)}</h3>
                <TextInput
                  id="primaryProfileFirstName"
                  label={t(`${T_PATH}.firstName`)}
                  placeholder={t(`${T_PATH}.firstName`)}
                  required
                  invalid={Boolean(errors.primary_profile?.first_name)}
                  errorText={errors.primary_profile?.first_name?.message}
                  autoComplete="off"
                  {...register('primary_profile.first_name', { required: true })}
                />
                <TextInput
                  id="primaryProfileLastName"
                  label={t(`${T_PATH}.lastName`)}
                  placeholder={t(`${T_PATH}.lastName`)}
                  required
                  invalid={Boolean(errors.primary_profile?.last_name)}
                  errorText={errors.primary_profile?.last_name?.message}
                  autoComplete="off"
                  {...register('primary_profile.last_name', { required: true })}
                />
                <TextInput
                  id="primaryProfileNationalIdentificationNumber"
                  label={t(`${T_PATH}.nationalIdentificationNumber`)}
                  placeholder={t(`${T_PATH}.nationalIdentificationNumber`)}
                  invalid={Boolean(errors.primary_profile?.national_identification_number)}
                  errorText={errors.primary_profile?.national_identification_number?.message}
                  autoComplete="off"
                  style={{ width: '67%' }}
                  {...register('primary_profile.national_identification_number')}
                />
                <TextInput
                  id="primaryProfileDateOfBirth"
                  label={t(`${T_PATH}.dateOfBirth`)}
                  placeholder={t(`${T_PATH}.dateOfBirth`)}
                  required
                  invalid={Boolean(errors.primary_profile?.date_of_birth)}
                  errorText={errors.primary_profile?.date_of_birth?.message}
                  helperText={t('d.m.yyyy')}
                  autoComplete="off"
                  style={{ width: '67%' }}
                  {...register('primary_profile.date_of_birth', { required: true })}
                />
              </div>
              <div className={styles.column} style={{ flexBasis: '50%' }}>
                <h3>{t(`${T_PATH}.customerContactDetail`)}</h3>
                <div className={styles.row}>
                  <div className={styles.column} style={{ flexBasis: '50%' }}>
                    <TextInput
                      id="primaryProfileStreetAddress"
                      label={t(`${T_PATH}.streetAddress`)}
                      placeholder={t(`${T_PATH}.streetAddress`)}
                      required
                      invalid={Boolean(errors.primary_profile?.street_address)}
                      errorText={errors.primary_profile?.street_address?.message}
                      autoComplete="off"
                      {...register('primary_profile.street_address', { required: true })}
                    />
                    <div className={styles.row}>
                      <div className={styles.column} style={{ flexBasis: '33.33333%' }}>
                        <TextInput
                          id="primaryProfilePostalCode"
                          label={t(`${T_PATH}.postalCode`)}
                          placeholder={t(`${T_PATH}.postalCode`)}
                          required
                          invalid={Boolean(errors.primary_profile?.postal_code)}
                          errorText={errors.primary_profile?.postal_code?.message}
                          autoComplete="off"
                          {...register('primary_profile.postal_code', { required: true })}
                        />
                      </div>
                      <div className={styles.column} style={{ flexBasis: '66.66666%' }}>
                        <TextInput
                          id="primaryProfileCity"
                          label={t(`${T_PATH}.city`)}
                          placeholder={t(`${T_PATH}.city`)}
                          required
                          invalid={Boolean(errors.primary_profile?.city)}
                          errorText={errors.primary_profile?.city?.message}
                          autoComplete="off"
                          {...register('primary_profile.city', { required: true })}
                        />
                      </div>
                    </div>
                    <PhoneInput
                      id="primaryProfilePhoneNumber"
                      label={t(`${T_PATH}.phoneNumber`)}
                      placeholder={t(`${T_PATH}.phoneNumber`)}
                      required
                      invalid={Boolean(errors.primary_profile?.phone_number)}
                      errorText={errors.primary_profile?.phone_number?.message}
                      autoComplete="off"
                      style={{ width: '50%' }}
                      {...register('primary_profile.phone_number', { required: true })}
                    />
                    <TextInput
                      id="primaryProfileEmail"
                      type="email"
                      label={t(`${T_PATH}.email`)}
                      placeholder={t(`${T_PATH}.email`)}
                      required
                      invalid={Boolean(errors.primary_profile?.email)}
                      errorText={errors.primary_profile?.email?.message}
                      autoComplete="off"
                      {...register('primary_profile.email', { required: true })}
                    />
                    <Controller
                      name="primary_profile.contact_language"
                      control={control}
                      render={({ field }) => (
                        <Select
                          id="primaryProfileContactLanguage"
                          label={t(`${T_PATH}.contact_language`)}
                          placeholder={t(`${T_PATH}.contact_language`)}
                          required
                          invalid={Boolean(errors.primary_profile?.contact_language)}
                          error={errors.primary_profile?.contact_language?.message}
                          options={contactLanguageOptions}
                          value={getContactLanguageOption(field.value || '')}
                          onChange={(selected: SelectOption) => {
                            setValue('primary_profile.contact_language', selected.selectValue as LangCode);
                          }}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.secondaryProfile}>
              <span className={styles.divider} />
              <h2>{t(`${T_PATH}.secondaryCustomer`)}</h2>
              <Controller
                name="has_secondary_profile"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="hasCoApplicant"
                    label={t(`${T_PATH}.hasCoApplicant`)}
                    checked={Boolean(field.value)}
                    errorText={errors.has_secondary_profile?.message}
                    {...register('has_secondary_profile')}
                  />
                )}
              />
              {!!hasSecondaryProfile && (
                <div className={cx(styles.row, styles.secondaryProfileFields)}>
                  <div className={styles.column} style={{ flexBasis: '50%' }}>
                    <h3>{t(`${T_PATH}.secondaryCustomerPersonalInfo`)}</h3>
                    <TextInput
                      id="secondaryProfileFirstName"
                      label={t(`${T_PATH}.firstName`)}
                      placeholder={t(`${T_PATH}.lastName`)}
                      required
                      invalid={Boolean(get(errors, 'secondary_profile.first_name'))}
                      errorText={get(errors, 'secondary_profile.first_name')?.message}
                      autoComplete="off"
                      {...register('secondary_profile.first_name', { required: true })}
                    />
                    <TextInput
                      id="secondaryProfileLastName"
                      label={t(`${T_PATH}.lastName`)}
                      placeholder={t(`${T_PATH}.lastName`)}
                      required
                      invalid={Boolean(get(errors, 'secondary_profile.last_name'))}
                      errorText={get(errors, 'secondary_profile.last_name')?.message}
                      autoComplete="off"
                      {...register('secondary_profile.last_name', { required: true })}
                    />
                    <TextInput
                      id="secondaryProfileNationalIdentificationNumber"
                      label={t(`${T_PATH}.nationalIdentificationNumber`)}
                      placeholder={t(`${T_PATH}.nationalIdentificationNumber`)}
                      invalid={Boolean(get(errors, 'secondary_profile.national_identification_number'))}
                      errorText={get(errors, 'secondary_profile.national_identification_number')?.message}
                      autoComplete="off"
                      style={{ width: '67%' }}
                      {...register('secondary_profile.national_identification_number')}
                    />
                    <TextInput
                      id="secondaryProfileDateOfBirth"
                      label={t(`${T_PATH}.dateOfBirth`)}
                      placeholder={t(`${T_PATH}.dateOfBirth`)}
                      required
                      invalid={Boolean(get(errors, 'secondary_profile.date_of_birth'))}
                      errorText={get(errors, 'secondary_profile.date_of_birth')?.message}
                      helperText={t('d.m.yyyy')}
                      autoComplete="off"
                      style={{ width: '67%' }}
                      {...register('secondary_profile.date_of_birth', { required: true })}
                    />
                  </div>
                  <div className={styles.column} style={{ flexBasis: '50%' }}>
                    <h3>{t(`${T_PATH}.secondaryCustomerContactDetail`)}</h3>
                    <div className={styles.row}>
                      <div className={styles.column} style={{ flexBasis: '50%' }}>
                        <TextInput
                          id="secondaryProfileStreetAddress"
                          label={t(`${T_PATH}.streetAddress`)}
                          placeholder={t(`${T_PATH}.streetAddress`)}
                          required
                          invalid={Boolean(get(errors, 'secondary_profile.street_address'))}
                          errorText={get(errors, 'secondary_profile.street_address')?.message}
                          autoComplete="off"
                          {...register('secondary_profile.street_address', { required: true })}
                        />
                        <div className={styles.row}>
                          <div className={styles.column} style={{ flexBasis: '33.33333%' }}>
                            <TextInput
                              id="secondaryProfilePostalCode"
                              label={t(`${T_PATH}.postalCode`)}
                              placeholder={t(`${T_PATH}.postalCode`)}
                              required
                              invalid={Boolean(get(errors, 'secondary_profile.postal_code'))}
                              errorText={get(errors, 'secondary_profile.postal_code')?.message}
                              autoComplete="off"
                              {...register('secondary_profile.postal_code', { required: true })}
                            />
                          </div>
                          <div className={styles.column} style={{ flexBasis: '66.66666%' }}>
                            <TextInput
                              id="secondaryProfileCity"
                              label={t(`${T_PATH}.city`)}
                              placeholder={t(`${T_PATH}.city`)}
                              required
                              invalid={Boolean(get(errors, 'secondary_profile.city'))}
                              errorText={get(errors, 'secondary_profile.city')?.message}
                              autoComplete="off"
                              {...register('secondary_profile.city', { required: true })}
                            />
                          </div>
                        </div>
                        <PhoneInput
                          id="secondaryProfilePhoneNumber"
                          label={t(`${T_PATH}.phoneNumber`)}
                          placeholder={t(`${T_PATH}.phoneNumber`)}
                          required
                          invalid={Boolean(get(errors, 'secondary_profile.phone_number'))}
                          errorText={get(errors, 'secondary_profile.phone_number')?.message}
                          autoComplete="off"
                          style={{ width: '50%' }}
                          {...register('secondary_profile.phone_number', { required: true })}
                        />
                        <TextInput
                          id="secondaryProfileEmail"
                          type="email"
                          label={t(`${T_PATH}.email`)}
                          placeholder={t(`${T_PATH}.email`)}
                          required
                          invalid={Boolean(get(errors, 'secondary_profile.email'))}
                          errorText={get(errors, 'secondary_profile.email')?.message}
                          autoComplete="off"
                          {...register('secondary_profile.email', { required: true })}
                        />
                        <Controller
                          name="secondary_profile.contact_language"
                          control={control}
                          render={({ field }) => (
                            <Select
                              id="secondaryProfileContactLanguage"
                              label={t(`${T_PATH}.contact_language`)}
                              placeholder={t(`${T_PATH}.contact_language`)}
                              required
                              invalid={Boolean(get(errors, 'secondary_profile.contact_language'))}
                              error={get(errors, 'secondary_profile.contact_language')?.message}
                              options={contactLanguageOptions}
                              value={getContactLanguageOption(field.value || '')}
                              onChange={(selected: SelectOption) => {
                                setValue('secondary_profile.contact_language', selected.selectValue as LangCode);
                              }}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
        <Container>
          <div className={styles.section}>
            <div className={styles.row}>
              <div className={styles.column} style={{ flexBasis: '50%' }}>
                <TextInput
                  id="lastContactDate"
                  label={t(`${T_PATH}.lastContactDate`)}
                  helperText={t('d.m.yyyy')}
                  invalid={Boolean(errors.last_contact_date)}
                  errorText={errors.last_contact_date?.message}
                  autoComplete="off"
                  {...register('last_contact_date')}
                />
              </div>
              <div className={styles.column} style={{ flexBasis: '50%' }}>
                {isEditMode && (
                  <TextInput
                    id="createdAt"
                    label={t(`${T_PATH}.createdAt`)}
                    readOnly
                    invalid={Boolean(errors.created_at)}
                    errorText={errors.created_at?.message}
                    autoComplete="off"
                    style={{ width: '67%' }}
                    {...register('created_at')}
                  />
                )}
              </div>
            </div>
            <TextArea
              id="additionalInfo"
              label={t(`${T_PATH}.additionalInfo`)}
              invalid={Boolean(errors.additional_information)}
              errorText={errors.additional_information?.message}
              autoComplete="off"
              {...register('additional_information')}
            />
            <div className={styles.checkboxes}>
              <div className={styles.columnLabel}>{t(`${T_PATH}.hitas`)}</div>
              <Controller
                name="has_hitas_ownership"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="hasHitasOwnership"
                    label={t(`${T_PATH}.hasHitasOwnership`)}
                    checked={Boolean(field.value)}
                    errorText={errors.has_hitas_ownership?.message}
                    style={{ marginRight: 'var(--spacing-l)' }}
                    {...register('has_hitas_ownership')}
                  />
                )}
              />
              <Controller
                name="has_children"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="hasChildren"
                    label={t(`${T_PATH}.hasChildren`)}
                    checked={Boolean(field.value)}
                    errorText={errors.has_children?.message}
                    {...register('has_children')}
                  />
                )}
              />
            </div>
            <div className={styles.checkboxes}>
              <div className={styles.columnLabel}>{t(`${T_PATH}.haso`)}</div>
              <Controller
                name="is_age_over_55"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="isAgeOver55"
                    label={t(`${T_PATH}.isAgeOver55`)}
                    checked={Boolean(field.value)}
                    errorText={errors.is_age_over_55?.message}
                    style={{ marginRight: 'var(--spacing-l)' }}
                    {...register('is_age_over_55')}
                  />
                )}
              />
              <Controller
                name="is_right_of_occupancy_housing_changer"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="isRightOfOccupancyHousingChanger"
                    label={t(`${T_PATH}.isRightOfOccupancyHousingChanger`)}
                    checked={Boolean(field.value)}
                    errorText={errors.is_right_of_occupancy_housing_changer?.message}
                    {...register('is_right_of_occupancy_housing_changer')}
                  />
                )}
              />
            </div>
            <div>
              <TextInput
                id="rightOfResidence"
                type="number"
                label={t(`${T_PATH}.rightOfResidence`)}
                invalid={Boolean(errors.right_of_residence)}
                errorText={errors.right_of_residence?.message}
                style={{ width: '50%' }}
                {...register('right_of_residence')}
              />
            </div>
          </div>

          <div className={styles.buttons}>
            <span className={styles.divider} />
            <Button type="submit" isLoading={isSubmitting} loadingText={t(`${T_PATH}.saving`)}>
              {t(`${T_PATH}.save`)}
            </Button>
            <Link
              to={isEditMode ? `/${ROUTES.CUSTOMERS}/${customerId}` : `/${ROUTES.CUSTOMERS}`}
              className={`${styles.cancel} hds-button hds-button--supplementary`}
            >
              <span className="hds-button__label">{t(`${T_PATH}.cancel`)}</span>
            </Link>
          </div>
        </Container>
      </form>
    </>
  );
};

export default AddEditCustomer;
