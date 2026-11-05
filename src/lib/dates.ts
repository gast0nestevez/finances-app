const pad = (value: number): string => String(value).padStart(2, "0");

const toIsoDate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const toIsoMonth = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

export { toIsoDate, toIsoMonth };
