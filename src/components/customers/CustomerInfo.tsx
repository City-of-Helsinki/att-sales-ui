import React from 'react';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import { Checkbox, Notification } from 'hds-react';

import formatDateTime from '../../utils/formatDateTime';
import { Customer } from '../../types';

import styles from './CustomerInfo.module.scss';

const T_PATH = 'components.customers.CustomerInfo';

interface IProps {
  customer?: Customer;
}

interface InfoItemProps {
  label: string;
  largeFont?: boolean;
  children?: string | React.ReactNode;
}

const CustomerInfo = ({ customer }: IProps): JSX.Element => {
  const { t } = useTranslation();

  if (!customer) {
    return (
      <Notification type="error" size="small" style={{ marginBottom: 24 }}>
        {t(`${T_PATH}.errorNoCustomer`)}
      </Notification>
    );
  }

  const InfoItem = ({ label, largeFont, children }: InfoItemProps): JSX.Element => (
    <div className={styles.singleInfoItem}>
      <div className={styles.singleInfoItemLabel}>{label}</div>
      <div className={cx(styles.singleInfoItemContent, largeFont && styles.largeFont)}>{children}</div>
    </div>
  );

  const renderProfileInfo = (customer: Customer, isPrimary: boolean) => {
    const profile = isPrimary ? customer.primary_profile : customer.secondary_profile;

    if (!profile) return;

    return (
      <>
        <div className={styles.customerInfoColumn}>
          <InfoItem label={t(`${T_PATH}.name`)} largeFont>
            {profile.last_name}, {profile.first_name}
          </InfoItem>
          <InfoItem label={t(`${T_PATH}.nin`)}>{profile.national_identification_number || '-'}</InfoItem>
          <InfoItem label={t(`${T_PATH}.dateOfBirth`)}>
            {profile.date_of_birth ? formatDateTime(profile.date_of_birth, true) : '-'}
          </InfoItem>
        </div>
        <div className={styles.customerInfoColumn}>
          <InfoItem label={t(`${T_PATH}.contactDetails`)}>
            <>
              <div>
                {profile.street_address && `${profile.street_address},`} {profile.postal_code} {profile.city}
              </div>
              <div>{profile.phone_number}</div>
              <div>{profile.email}</div>
            </>
          </InfoItem>
          <InfoItem label={t(`${T_PATH}.contactLanguage`)}>
            {profile.contact_language ? t(`${T_PATH}.contactLanguage_${profile.contact_language}`) : '-'}
          </InfoItem>
        </div>
        {isPrimary && (
          <div className={styles.customerInfoColumn}>
            <InfoItem label={t(`${T_PATH}.registered`)}>
              {customer.created_at ? formatDateTime(customer.created_at) : '-'}
            </InfoItem>
            <InfoItem label={t(`${T_PATH}.lastContactDate`)}>
              {customer.last_contact_date ? formatDateTime(customer.last_contact_date, true) : '-'}
            </InfoItem>
            <InfoItem label={t(`${T_PATH}.extraInfo`)}>{customer.additional_information || '-'}</InfoItem>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div className={styles.customerInfoWrapper}>{renderProfileInfo(customer, true)}</div>

      <div className={styles.extraInfoRow}>
        <div className={styles.extraInfoRowItem}>
          <InfoItem label={t(`${T_PATH}.hitas`)}>
            <div className={styles.checkBoxRow}>
              <Checkbox
                id="customerHasHitasOwnership"
                label={t(`${T_PATH}.customerHasHitasOwnership`)}
                checked={Boolean(customer.has_hitas_ownership)}
                readOnly
                disabled
                style={{ marginRight: 'var(--spacing-l)' }}
              />
              <Checkbox
                id="customerHasChildren"
                label={t(`${T_PATH}.familyWithChildren`)}
                checked={Boolean(customer.has_children)}
                readOnly
                disabled
              />
            </div>
          </InfoItem>
        </div>
        <div className={styles.extraInfoRowItem}>
          <InfoItem label={t(`${T_PATH}.haso`)}>
            <div className={styles.checkBoxRow}>
              <Checkbox
                id="customerIsOver55"
                label={t(`${T_PATH}.customerIsOver55`)}
                checked={Boolean(customer.is_age_over_55)}
                readOnly
                disabled
                style={{ marginRight: 'var(--spacing-l)' }}
              />
              <Checkbox
                id="customerHasHitasOwnership"
                label={t(`${T_PATH}.customerHasHasoOwnership`)}
                checked={Boolean(customer.is_right_of_occupancy_housing_changer)}
                readOnly
                disabled
              />
            </div>
          </InfoItem>
        </div>
        <div className={styles.extraInfoRowItem}>
          <InfoItem label={t(`${T_PATH}.hasoNumber`)}>
            {customer.right_of_residence ? customer.right_of_residence.toString() : '-'}
          </InfoItem>
        </div>
      </div>

      {customer.secondary_profile && (
        <>
          <h2 className={styles.coApplcantTitle}>{t(`${T_PATH}.coApplicant`)}</h2>
          <div className={styles.customerInfoWrapper}>{renderProfileInfo(customer, false)}</div>
        </>
      )}
    </>
  );
};

export default CustomerInfo;
