import i18n from 'i18next';

export default function formatDateTime(value: string, dateOnly?: boolean) {
  let locale = '';

  switch (i18n.language) {
    case 'en':
      locale = 'en-US';
      break;
    case 'sv':
      locale = 'sv-FI';
      break;
    default:
      locale = 'fi-FI';
  }

  if (dateOnly) {
    return new Intl.DateTimeFormat(locale).format(new Date(value));
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
