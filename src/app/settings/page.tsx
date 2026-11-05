import { connection } from "next/server";
import { listCategories } from "../../db/categories.ts";
import { findIncomeForMonth } from "../../db/income.ts";
import { getDatabase } from "../../db/instance.ts";
import { findInvestmentGoal } from "../../db/investment-goal.ts";
import { toIsoMonth } from "../../lib/dates.ts";
import { formatCentsForInput, formatMoney, money } from "../../lib/money.ts";
import { getCurrentRate } from "../../services/exchange-rate-service.ts";
import type { CurrentRate } from "../../services/exchange-rate-service.ts";
import ActionForm from "../../components/action-form.tsx";
import {
  addCategoryAction,
  deleteCategoryAction,
  renameCategoryAction,
  saveIncomeAction,
  saveInvestmentGoalAction,
  saveManualRateAction,
} from "./actions.ts";

const inputClassName = "rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm";
const sectionClassName = "space-y-3 rounded-lg border border-neutral-200 bg-white p-5";

const loadRate = async (): Promise<CurrentRate | null> => {
  try {
    return await getCurrentRate({ database: getDatabase() });
  } catch {
    return null;
  }
};

const describeRate = (rate: CurrentRate | null): string => {
  if (rate === null) {
    return "No hay cotización disponible. Cargá una manualmente.";
  }
  const value = formatMoney(money(Math.round(rate.rate * 100), "ARS"));
  const origin = rate.source === "api" ? "MEP (dolarapi.com)" : "manual";
  const staleNote = rate.stale ? ` · desactualizada, última del ${rate.date}` : "";
  return `${value} por dólar · ${origin}${staleNote}`;
};

const SettingsPage = async () => {
  await connection();
  const database = getDatabase();
  const month = toIsoMonth(new Date());
  const incomeEntry = findIncomeForMonth(database, month);
  const goal = findInvestmentGoal(database);
  const categoryList = listCategories(database);
  const rate = await loadRate();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Configuración</h1>

      <section className={sectionClassName}>
        <h2 className="text-lg font-medium">Sueldo mensual (ARS)</h2>
        <p className="text-sm text-neutral-600">
          Se guarda para {month} y se mantiene en los meses siguientes hasta que lo cambies.
          {incomeEntry?.inherited === true ? ` Valor actual heredado de ${incomeEntry.month}.` : ""}
        </p>
        <ActionForm action={saveIncomeAction} submitLabel="Guardar sueldo">
          <label className="flex flex-col gap-1 text-sm">
            Monto
            <input
              name="amount"
              inputMode="decimal"
              required
              defaultValue={incomeEntry === null ? "" : formatCentsForInput(incomeEntry.amount.amount)}
              className={inputClassName}
            />
          </label>
        </ActionForm>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-medium">Objetivo de inversión mensual</h2>
        <ActionForm action={saveInvestmentGoalAction} submitLabel="Guardar objetivo">
          <label className="flex flex-col gap-1 text-sm">
            Monto
            <input
              name="amount"
              inputMode="decimal"
              required
              defaultValue={goal === null ? "" : formatCentsForInput(goal.amount)}
              className={inputClassName}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Moneda
            <select name="currency" defaultValue={goal?.currency ?? "USD"} className={inputClassName}>
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </select>
          </label>
        </ActionForm>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-medium">Cotización del dólar</h2>
        <p className="text-sm text-neutral-600">{describeRate(rate)}</p>
        <ActionForm action={saveManualRateAction} submitLabel="Fijar cotización">
          <label className="flex flex-col gap-1 text-sm">
            Cotización manual de hoy (ARS por USD)
            <input name="rate" inputMode="decimal" required className={inputClassName} />
          </label>
        </ActionForm>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-medium">Categorías de gastos</h2>
        <ul className="space-y-3">
          {categoryList.map((category) => (
            <li key={category.id} className="flex flex-wrap items-center gap-3">
              <ActionForm action={renameCategoryAction} submitLabel="Renombrar">
                <input type="hidden" name="id" value={category.id} />
                <input name="name" required defaultValue={category.name} className={inputClassName} />
              </ActionForm>
              <form action={deleteCategoryAction}>
                <input type="hidden" name="id" value={category.id} />
                <button type="submit" className="text-sm text-red-700 hover:underline">
                  Eliminar
                </button>
              </form>
            </li>
          ))}
          {categoryList.length === 0 ? (
            <li className="text-sm text-neutral-600">Todavía no hay categorías.</li>
          ) : null}
        </ul>
        <ActionForm action={addCategoryAction} submitLabel="Agregar categoría">
          <label className="flex flex-col gap-1 text-sm">
            Nueva categoría
            <input name="name" required className={inputClassName} />
          </label>
        </ActionForm>
      </section>
    </div>
  );
};

export default SettingsPage;
