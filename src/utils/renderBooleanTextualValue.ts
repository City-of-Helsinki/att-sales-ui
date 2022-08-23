import i18n from '../i18n/i18n';

const T_PATH = 'utils.renderBooleanTextualValue';

export const renderBooleanTextualValue = (value: boolean | null | undefined): string => {
  if (value === null || value === undefined) {
    return i18n.t(`${T_PATH}.unknown`);
  }
  return value ? i18n.t(`${T_PATH}.yes`) : i18n.t(`${T_PATH}.no`);
};
