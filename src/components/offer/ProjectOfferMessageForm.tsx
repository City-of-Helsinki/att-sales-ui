import React, { useEffect } from 'react';
import cx from 'classnames';
import { Button, Container, Notification, TextArea } from 'hds-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import Spinner from '../common/spinner/Spinner';
import { Project, ProjectExtraData, ProjectOfferMessageFormData } from '../../types';
import { toast } from '../common/toast/ToastManager';
import { useGetProjectExtraDataQuery, usePartialUpdateProjectExtraDataMutation } from '../../redux/services/api';

import styles from './ProjectOfferMessageForm.module.scss';

const T_PATH = 'components.offer.ProjectOfferMessageForm';

interface IProps {
  uuid: Project['uuid'];
}

const ProjectOfferMessageForm = ({ uuid }: IProps): JSX.Element => {
  const { t } = useTranslation();
  const { data, isFetching, isLoading, isError } = useGetProjectExtraDataQuery(uuid);
  const [updateProjectExtraData, { isLoading: patchExtraDataLoading }] = usePartialUpdateProjectExtraDataMutation();
  const schema = yup.object({
    offer_message_intro: yup.string(),
    offer_message_content: yup.string(),
  });
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<ProjectOfferMessageFormData>({
    resolver: yupResolver(schema),
  });

  // Fill form fields with data from API
  useEffect(() => {
    if (data) {
      reset({
        offer_message_intro: data.offer_message_intro,
        offer_message_content: data.offer_message_content,
      });
    }
  }, [data, reset]);

  const onSubmit: SubmitHandler<ProjectOfferMessageFormData> = (formData, event) => {
    event?.preventDefault();
    updateData(formData);
  };

  const updateData = async (formData: Partial<ProjectExtraData>) => {
    if (!patchExtraDataLoading) {
      try {
        // Send form data to API
        await updateProjectExtraData({ formData: formData, uuid: uuid })
          .unwrap()
          .then(() => {
            toast.show({ type: 'success', content: t(`${T_PATH}.formSentSuccessfully`) });
          });
      } catch (err: any) {
        // Catch error data
        console.error(err);
        toast.show({ type: 'error', content: t(`${T_PATH}.formApiError`) });
      }
    }
  };

  if (isLoading) return <Spinner />;

  if (isError) {
    return (
      <Notification type="error" size="small" style={{ marginTop: 15 }}>
        {t(`${T_PATH}.errorLoadingExtraData`)}
      </Notification>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {isFetching && (
        <div className={styles.fixedSpinner}>
          <Container className={styles.loadingSpinnerContainer}>
            <Spinner />
          </Container>
        </div>
      )}
      <div className={cx(isFetching && styles.disabled)}>
        <TextArea
          id="offerIntro"
          label={t(`${T_PATH}.offerIntroLabel`)}
          invalid={Boolean(errors.offer_message_intro)}
          errorText={errors.offer_message_intro?.message}
          autoComplete="off"
          className={styles.formField}
          {...register('offer_message_intro')}
        />
        <TextArea
          id="offerContent"
          label={t(`${T_PATH}.offerContentLabel`)}
          invalid={Boolean(errors.offer_message_content)}
          errorText={errors.offer_message_content?.message}
          autoComplete="off"
          className={cx(styles.formField, styles.formFieldLarge)}
          {...register('offer_message_content')}
        />
        <Button
          type="submit"
          isLoading={patchExtraDataLoading}
          disabled={isFetching}
          loadingText={t(`${T_PATH}.saving`)}
        >
          {t(`${T_PATH}.save`)}
        </Button>
      </div>
    </form>
  );
};

export default ProjectOfferMessageForm;
