import { parseISO, format } from 'date-fns';

export const formatDate = (date: Date | string) => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, 'PP');
};

export const serializeDate = (date: Date) => date.toISOString();

export const deserializeDate = (dateString: string) => new Date(dateString);