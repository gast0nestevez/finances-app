import CurrencySelect from "../../components/currency-select.tsx";
import { inputClassName } from "../../components/styles.ts";
import type { Category } from "../../db/categories.ts";
import type { Currency } from "../../lib/money.ts";

type ExpenseFieldValues = Readonly<{
  date: string;
  description: string;
  amount: string;
  currency: Currency;
  categoryId: string;
}>;

type ExpenseFieldsProps = Readonly<{
  categories: readonly Category[];
  values: ExpenseFieldValues;
}>;

const ExpenseFields = ({ categories, values }: ExpenseFieldsProps) => (
  <>
    <label className="flex flex-col gap-1 text-sm">
      Fecha
      <input
        name="date"
        required
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        pattern="\d{1,2}/\d{1,2}/\d{4}"
        title="Fecha con formato dd/mm/aaaa"
        defaultValue={values.date}
        className={`${inputClassName} w-36`}
      />
    </label>
    <label className="flex flex-col gap-1 text-sm">
      Descripción
      <input name="description" required defaultValue={values.description} className={inputClassName} />
    </label>
    <label className="flex flex-col gap-1 text-sm">
      Monto
      <input name="amount" inputMode="decimal" required defaultValue={values.amount} className={inputClassName} />
    </label>
    <CurrencySelect defaultValue={values.currency} />
    <label className="flex flex-col gap-1 text-sm">
      Categoría
      <select name="categoryId" defaultValue={values.categoryId} className={inputClassName}>
        <option value="">Sin categoría</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </label>
  </>
);

export default ExpenseFields;
export type { ExpenseFieldValues };
