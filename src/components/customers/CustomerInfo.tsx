import cx from 'classnames';
import { Checkbox, Notification, NotificationSize, Tab, TabList, TabPanel, Tabs } from 'hds-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Applicant, Customer } from '../../types';
import formatDateTime from '../../utils/formatDateTime';
import { getRightOfResidenceText } from '../../utils/getRightOfResidenceText';

import styles from './CustomerInfo.module.scss';

const T_PATH = 'components.customers.CustomerInfo';
const isEmptyish = (v?: string | null) => !v || v.trim() === '' || v.trim() === '-';
const pick = (primary?: string | null, fallback?: string | null) =>
  !isEmptyish(primary) ? (primary as string) : !isEmptyish(fallback) ? (fallback as string) : '';

interface IProps {
  customer?: Customer;
  applicant?: Applicant;
}

interface InfoItemProps {
  label: string;
  largeFont?: boolean;
}

const CustomerInfo: React.FC<IProps> = ({ customer, applicant }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<number>(0);

  if (!customer) {
    return (
      <Notification type="error" size={NotificationSize.Small} style={{ marginBottom: 24 }}>
        {t(`${T_PATH}.errorNoCustomer`)}
      </Notification>
    );
  }

  const InfoItem: React.FC<InfoItemProps> = ({ label, largeFont, children }) => (
    <div className={styles.singleInfoItem}>
      <div className={styles.singleInfoItemLabel}>{label}</div>
      <div className={cx(styles.singleInfoItemContent, largeFont && styles.largeFont)}>{children}</div>
    </div>
  );

  const renderProfileInfo = (
    customer: Customer,
    isPrimary: boolean,
    applicant?: {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone_number?: string;
      street_address?: string;
      city?: string;
      postal_code?: string;
    }
  ) => {
    const profile = isPrimary ? customer.primary_profile : customer.secondary_profile;

    if (!profile) return null;

    const effFirstName = isPrimary ? pick(profile.first_name, applicant?.first_name) : profile.first_name;
    const effLastName = isPrimary ? pick(profile.last_name, applicant?.last_name) : profile.last_name;
    const effEmail = pick(profile.email, applicant?.email);
    const effPhone = pick(profile.phone_number, applicant?.phone_number);
    const effStreet = pick(profile.street_address, applicant?.street_address);
    const effCity = pick(profile.city, applicant?.city);
    const effPostal = pick(profile.postal_code, applicant?.postal_code);

    const nameParts = [effLastName, effFirstName].filter(Boolean);
    const displayName = nameParts.length === 2 ? `${nameParts[0]}, ${nameParts[1]}` : nameParts[0] || '—';

    return (
      <>
        <div className={styles.customerInfoColumn}>
          <InfoItem label={t(`${T_PATH}.name`)} largeFont>
            {displayName}
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
                {effStreet && `${effStreet}, `}
                {effPostal} {effCity}
              </div>
              <div>{effPhone || '—'}</div>
              <div>{effEmail || '—'}</div>
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

  const renderApplicantInfo = (applicant: Applicant | undefined) => {
    if (!applicant) return null;

    return (
      <div className={styles.customerInfoColumn}>
        <InfoItem label={t(`${T_PATH}.name`)} largeFont>
          {applicant.last_name}, {applicant.first_name}
        </InfoItem>
        <InfoItem label={t(`${T_PATH}.email`)}>{applicant.email || '-'}</InfoItem>
        <InfoItem label={t(`${T_PATH}.phoneNumber`)}>{applicant.phone_number || '-'}</InfoItem>
        <InfoItem label={t(`${T_PATH}.streetAddress`)}>{applicant.street_address || '-'}</InfoItem>
        <InfoItem label={t(`${T_PATH}.city`)}>{applicant.city || '-'}</InfoItem>
        <InfoItem label={t(`${T_PATH}.postalCode`)}>{applicant.postal_code || '-'}</InfoItem>
      </div>
    );
  };

  return (
    <Tabs initiallyActiveTab={activeTab}>
      <TabList>
        <Tab onClick={() => setActiveTab(0)}>{t(`${T_PATH}.customerDetailsTab`)}</Tab>
        <Tab onClick={() => setActiveTab(1)}>{t(`${T_PATH}.latestApplicantTab`)}</Tab>
      </TabList>

      <TabPanel>
        <div className={styles.customerInfoWrapper}>{renderProfileInfo(customer, true, applicant)}</div>

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
                />
                <Checkbox
                  id="customerHasHasoOwnership"
                  label={t(`${T_PATH}.customerHasHasoOwnership`)}
                  checked={Boolean(customer.is_right_of_occupancy_housing_changer)}
                  readOnly
                  disabled
                />
              </div>
            </InfoItem>
          </div>
          <div className={styles.extraInfoRowItem}>
            <InfoItem label={t(`${T_PATH}.hasoNumber`)}>{getRightOfResidenceText(customer)}</InfoItem>
          </div>
        </div>

        {customer.secondary_profile && (
          <>
            <h2 className={styles.coApplicantTitle}>{t(`${T_PATH}.coApplicant`)}</h2>
            <div className={styles.customerInfoWrapper}>{renderProfileInfo(customer, false, applicant)}</div>
          </>
        )}
      </TabPanel>

      <TabPanel>
        <div className={styles.customerInfoWrapper}>{renderApplicantInfo(applicant)}</div>
      </TabPanel>
    </Tabs>
  );
};

export default CustomerInfo;
