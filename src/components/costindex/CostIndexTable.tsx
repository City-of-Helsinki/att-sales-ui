import React, { useState } from 'react';
import moment from 'moment/moment';
import { get, SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button, DateInput, Dialog, IconPlus, IconQuestionCircle, Notification, Table, TextInput } from 'hds-react';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';

import { getCurrentLangCode } from '../../utils/getCurrentLangCode';
import { useAddCostIndexMutation, useGetCostIndexesQuery } from '../../redux/services/api';
import Container from '../common/container/Container';
import { AddEditCostIndex } from '../../types';
import parseApiErrors from '../../utils/parseApiErrors';
import Spinner from '../common/spinner/Spinner';
import { toast } from '../common/toast/ToastManager';
import { usePageTitle } from '../../utils/usePageTitle';
import CostIndexSingleTable from './CostIndexSingleTable';

import styles from './CostIndexTable.module.scss';

const T_PATH = 'components.costindex.CostIndexTable';

const CostIndexTable = (): JSX.Element => {
  const { t: translate } = useTranslation();
  const t = (label: string) => translate(`${T_PATH}.${label}`);
  usePageTitle(t('indexValue'));

  const { data, isLoading, isError } = useGetCostIndexesQuery();
  const [addCostIndex, { isLoading: addIsLoading }] = useAddCostIndexMutation();

  const confirmationDialogTarget = React.useRef(null);
  const openConfirmationDialogButtonRef = React.useRef(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const close = () => setIsOpen(false);
  const titleId = 'info-dialog-title';
  const descriptionId = 'info-dialog-content';

  const schema = yup.object({
    valid_from: yup
      .string()
      .trim()
      .matches(/\d{1,2}\.\d{1,2}\.\d{4}/, t('invalidDate'))
      .required(t(`required`)),
    value: yup
      .string()
      .trim()
      .matches(/^\d+([.,]\d{1,2})?$/, t('invalidValue'))
      .required(t(`required`)),
  });
  const { handleSubmit, register, setValue, formState, watch, reset, trigger, getValues } = useForm<AddEditCostIndex>({
    resolver: yupResolver(schema),
  });

  const errors = formState.errors;
  const validFromDate = watch('valid_from');
  const formId = `cost-index-add-form`;

  const validFrom = getValues('valid_from');
  const value = getValues('value');

  if (isLoading) {
    return <Spinner />;
  } else if (isError || !data) {
    return (
      <Container>
        <Notification type="error" size="small" style={{ marginTop: 15 }}>
          {t('errorLoadingCostIndex')}
        </Notification>
      </Container>
    );
  }
  const fiDateToISO = (date: string) => moment(date, 'D.M.YYYY', true).format('YYYY-MM-DD');
  const ISODateToFi = (date: string) => moment(date, 'YYYY-MM-DD').format('D.M.YYYY');
  const getValidTo = (index: number) => {
    if (index === 0) {
      return t('indefinite');
    }
    return moment(data[index - 1].valid_from, 'YYYY-MM-DD')
      .subtract(1, 'day')
      .format('D.M.YYYY');
  };

  const onSubmit: SubmitHandler<AddEditCostIndex> = (data, event) => {
    event?.preventDefault();
    handleFormSubmit(data);
  };

  const handleFormSubmit = async (data: AddEditCostIndex) => {
    data.valid_from = fiDateToISO(data.valid_from);
    data.value = data.value.replace(',', '.');

    if (!addIsLoading) {
      try {
        await addCostIndex({ formData: data })
          .unwrap()
          .then(() => {
            toast.show({ type: 'success', content: t('createdSuccessfully') });
            reset();
          });
      } catch (err: any) {
        setErrorMessages(parseApiErrors(err));
      }
    }
  };
  const cols = [
    { key: 'id', headerName: 'Not rendered' },
    {
      key: 'valid_from',
      headerName: t('indexValidFrom'),
      transform: (row: { valid_from: string; index: number }) => {
        return (
          <div>
            {ISODateToFi(row.valid_from)} - {getValidTo(row.index)}
          </div>
        );
      },
    },
    {
      key: 'value',
      headerName: t('indexValue'),
      transform: (row: { value: string }) => {
        return <div style={{ textAlign: 'right' }}>{row.value}</div>;
      },
    },
  ];
  const rows = data.map((row, index) => {
    return { index: index, ...row };
  });

  const { onChange: validFromFormOnChange, ...validFromFormProps } = register('valid_from');
  return (
    <Container>
      <h2>{t('addIndexTitle')}</h2>
      {!!errorMessages.length && (
        <div className={styles.errorWrapper}>
          <Notification type="error" style={{ margin: '15px 0' }} label={t('formError')}>
            <ul>
              {errorMessages.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Notification>
        </div>
      )}
      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.formAddRow}>
          <span>
            <DateInput
              id="indexValidFrom"
              label={t('indexValidFrom')}
              invalid={
                Boolean(get(errors, 'valid_from')) ||
                (!!validFromDate && !moment(validFromDate, 'D.M.YYYY', true).isValid())
              }
              language={getCurrentLangCode()}
              errorText={get(errors, 'valid_from')?.message}
              onChange={(value) => setValue('valid_from', value)}
              required
              {...validFromFormProps}
            />
          </span>
          <span className={styles.indexValueColumn}>
            <TextInput
              id="indexValue"
              label={t('indexValue')}
              placeholder="100,00"
              errorText={get(errors, 'value')?.message}
              invalid={Boolean(errors.value)}
              required
              {...register('value')}
            />
          </span>
        </div>
        <div>
          <Button
            variant="primary"
            iconLeft={<IconPlus />}
            ref={openConfirmationDialogButtonRef}
            onClick={() =>
              trigger().then((valid) => {
                if (valid) {
                  setIsOpen(true);
                }
              })
            }
          >
            {t('save')}
          </Button>
        </div>
        <div ref={confirmationDialogTarget} />

        <Dialog
          id="confirmation-dialog"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          isOpen={isOpen}
          focusAfterCloseRef={openConfirmationDialogButtonRef}
          targetElement={confirmationDialogTarget.current ?? undefined}
        >
          <Dialog.Header id={titleId} title={t('confirmTitle')} iconLeft={<IconQuestionCircle aria-hidden="true" />} />
          <Dialog.Content>
            <p id={descriptionId} className="text-body">
              {t('confirmBody')}
            </p>
            <CostIndexSingleTable costIndex={{ valid_from: fiDateToISO(validFrom), value: value }} />
          </Dialog.Content>
          <Dialog.ActionButtons>
            {/* Calling close directly prevents the form from being submitted */}
            <Button type="submit" form={formId} onClick={() => setTimeout(close, 1)}>
              {t('save')}
            </Button>
            <Button onClick={close} variant="secondary">
              {t('confirmCancel')}
            </Button>
          </Dialog.ActionButtons>
        </Dialog>
      </form>
      <h2>{t('listIndexTitle')}</h2>
      <div className={styles.tableContainer}>
        <Table cols={cols} rows={rows} variant="light" indexKey="id" renderIndexCol={false} />
      </div>
    </Container>
  );
};

export default CostIndexTable;
