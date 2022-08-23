import i18n from '../i18n/i18n';
import { Project } from '../types';

const T_PATH = 'utils.getProjectState';

export const getProjectState = (project: Project): string => {
  if (project.archived) {
    // Example: "Ready (Archived)"
    return i18n.t(`ENUMS.StateOfSale.${project.state_of_sale}`) + ' (' + i18n.t(`${T_PATH}.archived`) + ')';
  }

  if (!project.published) {
    // Example: "Upcoming (Unpublished)"
    return i18n.t(`ENUMS.StateOfSale.${project.state_of_sale}`) + ' (' + i18n.t(`${T_PATH}.unpublished`) + ')';
  }

  return i18n.t(`ENUMS.StateOfSale.${project.state_of_sale}`);
};
