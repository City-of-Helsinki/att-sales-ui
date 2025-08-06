import { useEffect, useState } from 'react';
import { Apartment, Project } from '../../types';
import ApartmentRow from './ApartmentRow';

interface DelayedApartmentRowProps {
  delayMs: number;
  apartment: Apartment;
  ownershipType: Project['ownership_type'];
  isLotteryCompleted: boolean;
  project: Project;
}

const DelayedApartmentRow = ({ delayMs, ...props }: DelayedApartmentRowProps) => {
  const [enabled, setEnabled] = useState(delayMs === 0);

  useEffect(() => {
    if (delayMs === 0) return;
    const timer = setTimeout(() => setEnabled(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  return enabled ? <ApartmentRow {...props} /> : null;
};

export default DelayedApartmentRow;
