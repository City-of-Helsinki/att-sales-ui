import { useEffect } from 'react';

export function usePageTitle(title: string) {
  const baseTitle = 'Asuntomyynti';

  useEffect(() => {
    const prevTitle = document.title;

    if (title) {
      document.title = `${title} - ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }

    return () => {
      document.title = prevTitle ? prevTitle : baseTitle;
    };
  });
}
