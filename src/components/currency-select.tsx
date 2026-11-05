import type { Currency } from "../lib/money.ts";
import { inputClassName } from "./styles.ts";

type CurrencySelectProps = Readonly<{
  defaultValue: Currency;
}>;

const CurrencySelect = ({ defaultValue }: CurrencySelectProps) => (
  <label className="flex flex-col gap-1 text-sm">
    Moneda
    <select name="currency" defaultValue={defaultValue} className={inputClassName}>
      <option value="ARS">ARS</option>
      <option value="USD">USD</option>
    </select>
  </label>
);

export default CurrencySelect;
