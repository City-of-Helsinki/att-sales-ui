export const slugify = (text: string): string => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')  // Remove all non-word characters except spaces and hyphens
      .replace(/[\s_-]+/g, '-')  // Replace spaces, underscores, and hyphens with a single hyphen
      .replace(/^-+|-+$/g, '');  // Remove leading and trailing hyphens
  };