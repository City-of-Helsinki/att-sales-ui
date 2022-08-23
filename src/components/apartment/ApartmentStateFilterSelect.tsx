import { Select } from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { SelectOption } from '../../types';
import { ApartmentState } from '../../enums';

const T_PATH = 'components.apartment.ApartmentStateFilterSelect';

interface IProps {
  activeFilter: string;
  handleFilterChangeCallback: (value: string) => void;
}

const ApartmentStateFilterSelect = ({ activeFilter, handleFilterChangeCallback }: IProps) => {
  const { t } = useTranslation();

  const handleSelectChange = (value: SelectOption) => {
    handleFilterChangeCallback(value.selectValue);
  };

  const selectOptions = (): SelectOption[] => {
    // Define an empty value as the first dropdown item to show all apartments
    let options: SelectOption[] = [
      {
        label: t(`${T_PATH}.allApartments`),
        name: 'ApartmentState',
        selectValue: '',
      },
    ];
    // Loop through ApartmentState ENUMs and create dropdown options out of them
    Object.values(ApartmentState).forEach((type) => {
      options.push({
        label: t(`ENUMS.ApartmentState.${type}`),
        name: 'ApartmentState',
        selectValue: type,
      });
    });
    return options;
  };

  return (
    <Select
      label={t(`${T_PATH}.show`)}
      placeholder={t(`${T_PATH}.allApartments`)}
      options={selectOptions()}
      value={selectOptions().find((option) => option.selectValue === activeFilter || '')}
      onChange={(value: SelectOption) => handleSelectChange(value)}
      visibleOptions={7}
    />
  );
};

export default ApartmentStateFilterSelect;
