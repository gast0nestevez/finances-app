import Link from "next/link";
import { connection } from "next/server";
import ActionForm from "../../components/action-form.tsx";
import CurrencySelect from "../../components/currency-select.tsx";
import { dangerButtonClassName, inputClassName, sectionClassName } from "../../components/styles.ts";
import { listCategories } from "../../db/categories.ts";
import { listExpensesByMonth } from "../../db/expenses.ts";
import { getDatabase } from "../../db/instance.ts";
import { formatDisplayDate, formatDisplayMonth, shiftMonth, toIsoDate, toIsoMonth } from "../../lib/dates.ts";
import { sumVariableExpenses } from "../../lib/month-summary.ts";
import { convert, formatMoney } from "../../lib/money.ts";
import type { Currency } from "../../lib/money.ts";
import { resolveMonth } from "../search-params.ts";
import type { SearchParamValue } from "../search-params.ts";
import { createExpenseAction, deleteExpenseAction } from "./actions.ts";

type ExpensesPageProps = Readonly<{
  searchParams: Promise<Readonly<Record<string, SearchParamValue>>>;
}>;

const otherCurrency = (currency: Currency): Currency => (currency === "ARS" ? "USD" : "ARS");

const ExpensesPage = async ({ searchParams }: ExpensesPageProps) => {
  await connection();
  const now = new Date();
  const currentMonth = toIsoMonth(now);
  const month = resolveMonth((await searchParams)["month"], currentMonth);
  const database = getDatabase();
  const expenses = listExpensesByMonth(database, month);
  const categories = listCategories(database);
  const totals = expenses.map((expense) => ({
    amount: expense.amount,
    rateAtRegistration: expense.rateAtRegistration,
  }));
  const totalArs = sumVariableExpenses(totals, "ARS");
  const totalUsd = sumVariableExpenses(totals, "USD");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Gastos</h1>

      <section className={sectionClassName}>
        <h2 className="text-lg font-medium">Registrar gasto</h2>
        <ActionForm action={createExpenseAction} submitLabel="Registrar">
          <label className="flex flex-col gap-1 text-sm">
            Fecha
            <input
              name="date"
              required
              inputMode="numeric"
              placeholder="dd/mm/aaaa"
              pattern="\d{1,2}/\d{1,2}/\d{4}"
              title="Fecha con formato dd/mm/aaaa"
              defaultValue={formatDisplayDate(toIsoDate(now))}
              className={`${inputClassName} w-36`}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Descripción
            <input name="description" required className={inputClassName} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Monto
            <input name="amount" inputMode="decimal" required className={inputClassName} />
          </label>
          <CurrencySelect defaultValue="ARS" />
          <label className="flex flex-col gap-1 text-sm">
            Categoría
            <select name="categoryId" defaultValue="" className={inputClassName}>
              <option value="">Sin categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </ActionForm>
      </section>

      <section className={sectionClassName}>
        <div className="flex items-center justify-between">
          <Link href={`/expenses?month=${shiftMonth(month, -1)}`} className="text-sm hover:underline">
            ← {formatDisplayMonth(shiftMonth(month, -1))}
          </Link>
          <h2 className="text-lg font-medium">{formatDisplayMonth(month)}</h2>
          <Link href={`/expenses?month=${shiftMonth(month, 1)}`} className="text-sm hover:underline">
            {formatDisplayMonth(shiftMonth(month, 1))} →
          </Link>
        </div>
        <p className="text-sm text-neutral-600">
          Total del mes: <strong>{formatMoney(totalArs)}</strong> ≈ {formatMoney(totalUsd)}
        </p>
        {expenses.length === 0 ? (
          <p className="text-sm text-neutral-600">No hay gastos registrados en este mes.</p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {expenses.map((expense) => (
              <li key={expense.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{expense.description}</p>
                  <p className="text-xs text-neutral-600">
                    {formatDisplayDate(expense.date)} · {expense.categoryName ?? "Sin categoría"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-right">
                    <span className="block font-medium">{formatMoney(expense.amount)}</span>
                    <span className="block text-xs text-neutral-600">
                      ≈{" "}
                      {formatMoney(
                        convert(expense.amount, otherCurrency(expense.amount.currency), expense.rateAtRegistration),
                      )}
                    </span>
                  </p>
                  <form action={deleteExpenseAction}>
                    <input type="hidden" name="id" value={expense.id} />
                    <button type="submit" className={dangerButtonClassName}>
                      Eliminar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ExpensesPage;
