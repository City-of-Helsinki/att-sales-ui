import { useEffect } from 'react';

export function usePageTitle(title: string) {
  const titlePostfix = '- Asuntomyynti';

  useEffect(() => {
    const prevTitle = document.title;

    document.title = `${title} ${titlePostfix}`;

    return () => {
      document.title = `${prevTitle} ${titlePostfix}`;
    };
  });
}
