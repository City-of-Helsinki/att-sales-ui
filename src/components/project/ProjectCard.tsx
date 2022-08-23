import React from 'react';
import { Button, Dialog, IconArrowRight, IconCogwheel, IconLinkExternal, IconQuestionCircle } from 'hds-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Label from '../common/label/Label';
import formatDateTime from '../../utils/formatDateTime';
import { getInitials } from '../../utils/getInitials';
import { getProjectState } from '../../utils/getProjectState';
import { Project } from '../../types';
import { ROUTES } from '../../enums';

import styles from './ProjectCard.module.scss';

const T_PATH = 'components.project.ProjectCard';

interface IProps {
  project: Project;
  showActions?: boolean;
  renderAsLink?: boolean;
  lotteryLoading?: boolean;
  lotteryOnClick?: () => void;
}

const ProjectCard = ({ project, renderAsLink, showActions, lotteryLoading, lotteryOnClick }: IProps): JSX.Element => {
  const { t } = useTranslation();
  const openLotteryConfirmDialogButtonRef = React.useRef(null);
  const [isLotteryConfirmOpen, setIsLotteryConfirmOpen] = React.useState(false);
  const {
    application_end_time,
    estate_agent,
    estimated_completion,
    district,
    housing_company,
    lottery_completed_at,
    main_image_url,
    ownership_type,
    street_address,
    url,
    uuid,
  } = project;

  const timeNow = new Date().getTime();
  const applicationPeriodHasEnded = application_end_time ? timeNow > new Date(application_end_time).getTime() : false;

  const closeLotteryConfirm = () => setIsLotteryConfirmOpen(false);

  const handleLotteryStartBtnClick = () => {
    if (lotteryOnClick) {
      lotteryOnClick();
    }
    closeLotteryConfirm();
  };

  const renderContent = () => (
    <>
      <div className={styles.projectDetails}>
        {main_image_url && (
          <div className={styles.projectImageColumn}>
            <img src={main_image_url} alt="" />
          </div>
        )}

        <div className={styles.projectDetailsColumn}>
          <h1 className={styles.projectName}>{housing_company}</h1>
          <div className={styles.projectLocation}>
            <strong>{district},</strong> {street_address}
          </div>
          <div className={styles.projectOwnershipType}>
            <Label type={ownership_type}>{ownership_type}</Label>
          </div>
          {estimated_completion && (
            <div className={styles.completionTime}>
              <IconCogwheel style={{ marginRight: 10 }} aria-hidden="true" /> {estimated_completion}
            </div>
          )}
        </div>
      </div>

      <div className={styles.projectActions}>
        <div className={styles.projectStatusColumn}>
          <IconArrowRight className={styles.statusArrowIcon} />
          <div className={styles.stateOfProject}>{getProjectState(project)}</div>
          <div>
            {applicationPeriodHasEnded ? t(`${T_PATH}.applicationTimeHasEnded`) : t(`${T_PATH}.applicationEndTime`)}
            &nbsp;
            {application_end_time ? formatDateTime(application_end_time) : '-'}
          </div>
          {!renderAsLink && (
            <>
              {project.lottery_completed_at && (
                <div className={styles.infoText}>
                  {t(`${T_PATH}.lotteryCompletedAt`)} {formatDateTime(project.lottery_completed_at)}
                </div>
              )}
              <div className={styles.infoText}>
                {t(`${T_PATH}.applications`)}: {project.application_count}
              </div>
            </>
          )}
          {showActions && !lottery_completed_at && (
            <div className={styles.lotteryBtnWrap}>
              <Button
                variant="primary"
                ref={openLotteryConfirmDialogButtonRef}
                disabled={!applicationPeriodHasEnded || lotteryLoading}
                onClick={() => setIsLotteryConfirmOpen(true)}
                isLoading={lotteryLoading}
                loadingText={
                  ownership_type.toLowerCase() === 'haso'
                    ? t(`${T_PATH}.hasoLotteryLoading`)
                    : t(`${T_PATH}.hitasLotteryLoading`)
                }
              >
                {ownership_type.toLowerCase() === 'haso'
                  ? t(`${T_PATH}.startHasoLottery`)
                  : t(`${T_PATH}.startHitasLottery`)}
              </Button>
            </div>
          )}
        </div>

        <div className={styles.projectRightColumn}>
          {!renderAsLink && (
            <div className={styles.projectLink}>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="hds-button hds-button--supplementary hds-button--small"
              >
                <IconLinkExternal aria-hidden="true" />
                <span className="hds-button__label">{t(`${T_PATH}.showProject`)}</span>
              </a>
            </div>
          )}
          <div className={styles.projectAssignee}>
            <span className={styles.tooltip}>{estate_agent ? estate_agent : t(`${T_PATH}.noEstateAgent`)}</span>
            <span className={styles.assigneeCircle}>{getInitials(estate_agent)}</span>
          </div>
        </div>
      </div>
      {showActions && !lottery_completed_at && (
        <Dialog
          id="lottery-confirm-dialog"
          aria-labelledby="lottery-confirm-dialog-title"
          aria-describedby="lottery-confirm-dialog-info"
          isOpen={isLotteryConfirmOpen}
          focusAfterCloseRef={openLotteryConfirmDialogButtonRef}
        >
          <Dialog.Header
            id="lottery-confirm-dialog-title"
            title={t(`${T_PATH}.startLotteryConfirmTitle`)}
            iconLeft={<IconQuestionCircle aria-hidden="true" />}
          />
          <Dialog.Content>
            <p id="lottery-confirm-dialog-info" className="text-body">
              {t(`${T_PATH}.startLotteryConfirmText`)}
            </p>
          </Dialog.Content>
          <Dialog.ActionButtons>
            <Button onClick={handleLotteryStartBtnClick}>
              {ownership_type.toLowerCase() === 'haso'
                ? t(`${T_PATH}.startHasoLottery`)
                : t(`${T_PATH}.startHitasLottery`)}
            </Button>
            <Button onClick={closeLotteryConfirm} variant="secondary">
              {t(`${T_PATH}.startLotteryCancel`)}
            </Button>
          </Dialog.ActionButtons>
        </Dialog>
      )}
    </>
  );

  return renderAsLink ? (
    <Link to={`/${ROUTES.PROJECTS}/${uuid}`} className={styles.projectCard}>
      {renderContent()}
    </Link>
  ) : (
    <div className={styles.projectCard}>{renderContent()}</div>
  );
};

export default ProjectCard;
