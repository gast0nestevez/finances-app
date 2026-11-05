import { connection } from "next/server";
import ActionForm from "../../components/action-form.tsx";
import CurrencySelect from "../../components/currency-select.tsx";
import {
  dangerButtonClassName,
  inputClassName,
  secondaryButtonClassName,
  sectionClassName,
} from "../../components/styles.ts";
import { listFixedExpenses } from "../../db/fixed-expenses.ts";
import { getDatabase } from "../../db/instance.ts";
import { formatCentsForInput, formatMoney, sum } from "../../lib/money.ts";
import { loadRate } from "../load-rate.ts";
import {
  createFixedExpenseAction,
  deleteFixedExpenseAction,
  setFixedExpenseActiveAction,
  updateFixedExpenseAction,
} from "./actions.ts";

const FixedExpensesPage = async () => {
  await connection();
  const fixedExpenses = listFixedExpenses(getDatabase());
  const active = fixedExpenses.filter((expense) => expense.active);
  const rate = await loadRate();
  const totals =
    rate === null
      ? null
      : {
          ars: sum(active.map((expense) => expense.amount), "ARS", rate.rate),
          usd: sum(active.map((expense) => expense.amount), "USD", rate.rate),
        };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Gastos fijos</h1>

      <section className={sectionClassName}>
        <h2 className="text-lg font-medium">Total mensual de gastos activos</h2>
        {totals === null ? (
          <p className="text-sm text-neutral-600">
            No hay cotización disponible para convertir los montos.
          </p>
        ) : (
          <p className="text-xl font-semibold">
            {formatMoney(totals.ars)} <span className="text-sm font-normal text-neutral-600">≈ {formatMoney(totals.usd)}</span>
          </p>
        )}
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-medium">Agregar gasto fijo</h2>
        <ActionForm action={createFixedExpenseAction} submitLabel="Agregar">
          <label className="flex flex-col gap-1 text-sm">
            Nombre
            <input name="name" required className={inputClassName} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Monto
            <input name="amount" inputMode="decimal" required className={inputClassName} />
          </label>
          <CurrencySelect defaultValue="ARS" />
        </ActionForm>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-medium">Listado</h2>
        {fixedExpenses.length === 0 ? (
          <p className="text-sm text-neutral-600">Todavía no cargaste gastos fijos.</p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {fixedExpenses.map((expense) => (
              <li key={expense.id} className={`space-y-2 py-4 ${expense.active ? "" : "opacity-60"}`}>
                <ActionForm action={updateFixedExpenseAction} submitLabel="Guardar">
                  <input type="hidden" name="id" value={expense.id} />
                  <input name="name" required defaultValue={expense.name} className={inputClassName} />
                  <input
                    name="amount"
                    inputMode="decimal"
                    required
                    defaultValue={formatCentsForInput(expense.amount.amount)}
                    className={inputClassName}
                  />
                  <CurrencySelect defaultValue={expense.amount.currency} />
                </ActionForm>
                <div className="flex gap-4">
                  <form action={setFixedExpenseActiveAction}>
                    <input type="hidden" name="id" value={expense.id} />
                    <input type="hidden" name="active" value={String(!expense.active)} />
                    <button type="submit" className={secondaryButtonClassName}>
                      {expense.active ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                  <form action={deleteFixedExpenseAction}>
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

export default FixedExpensesPage;
