const pad = (value: number): string => String(value).padStart(2, "0");

const toIsoDate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const toIsoMonth = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

const monthOfDate = (isoDate: string): string => {
  if (!isIsoDate(isoDate)) {
    throw new RangeError(`Invalid date: ${isoDate}`);
  }
  return isoDate.slice(0, 7);
};

const isIsoMonth = (value: string): boolean => MONTH_PATTERN.test(value);

const shiftMonth = (month: string, delta: number): string => {
  const match = MONTH_PATTERN.exec(month);
  if (match === null) {
    throw new RangeError(`Invalid month: ${month}`);
  }
  const index = Number(match[1]) * 12 + (Number(match[2]) - 1) + delta;
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`;
};

const isIsoDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
  return date.toISOString().slice(0, 10) === value;
};

const formatDisplayDate = (isoDate: string): string => {
  if (!isIsoDate(isoDate)) {
    throw new RangeError(`Invalid date: ${isoDate}`);
  }
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
};

const formatDisplayMonth = (isoMonth: string): string => {
  if (!isIsoMonth(isoMonth)) {
    throw new RangeError(`Invalid month: ${isoMonth}`);
  }
  const [year, month] = isoMonth.split("-");
  return `${month}/${year}`;
};

const DISPLAY_DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

const parseDisplayDate = (input: string): string | null => {
  const match = DISPLAY_DATE_PATTERN.exec(input.trim());
  if (match === null) {
    return null;
  }
  const isoDate = `${match[3]}-${pad(Number(match[2]))}-${pad(Number(match[1]))}`;
  return isIsoDate(isoDate) ? isoDate : null;
};

export {
  formatDisplayDate,
  formatDisplayMonth,
  isIsoDate,
  isIsoMonth,
  monthOfDate,
  parseDisplayDate,
  shiftMonth,
  toIsoDate,
  toIsoMonth,
};
