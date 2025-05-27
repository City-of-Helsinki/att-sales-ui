import { Select, Option } from 'hds-react';
import { useTranslation } from 'react-i18next';

import { ApartmentState } from '../../enums';

const T_PATH = 'components.apartment.ApartmentStateFilterSelect';

interface IProps {
  activeFilter: string;
  handleFilterChangeCallback: (value: string) => void;
}

const ApartmentStateFilterSelect = ({ activeFilter, handleFilterChangeCallback }: IProps) => {
  const { t } = useTranslation();

  const handleSelectChange = (value: Option) => {
    handleFilterChangeCallback(value.value);
  };

  const selectOptions = (): Option[] => {
    // Define an empty value as the first dropdown item to show all apartments
    let options: Option[] = [
      {
        label: t(`${T_PATH}.allApartments`),
        // name: 'ApartmentState',
        value: '-', // if this is empty string, gets replaced with label when selected
        disabled: false,
        visible: true,
        selected: false,
        isGroupLabel: false,
      },
    ];

    // Loop through ApartmentState ENUMs and create dropdown options out of them
    Object.values(ApartmentState).forEach((type) => {
      options.push({
        label: t(`ENUMS.ApartmentState.${type}`),
        value: type,
        disabled: false,
        visible: true,
        selected: false,
        isGroupLabel: false,
      });
    });

    return options;
  };

  return (
    <Select
      texts={{
        label: t(`${T_PATH}.show`),
      }}
      placeholder={t(`${T_PATH}.allApartments`)}
      options={selectOptions()}
      value={selectOptions().filter((option) => option.value === activeFilter || '')}
      onChange={(selected: Option[], clickedOption: Option) => handleSelectChange(clickedOption)}
      visibleOptions={7}
    />
  );
};

export default ApartmentStateFilterSelect;
