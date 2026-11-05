import Link from "next/link";
import { connection } from "next/server";
import { sectionClassName } from "../components/styles.ts";
import { listExpensesByMonth } from "../db/expenses.ts";
import { listActiveFixedExpenses } from "../db/fixed-expenses.ts";
import { findIncomeForMonth } from "../db/income.ts";
import { getDatabase } from "../db/instance.ts";
import { findInvestmentGoal } from "../db/investment-goal.ts";
import { formatDisplayDate, formatDisplayMonth, shiftMonth, toIsoMonth } from "../lib/dates.ts";
import { buildBreakdown } from "../lib/month-breakdown.ts";
import { summarizeMonth } from "../lib/month-summary.ts";
import { formatMoney, money } from "../lib/money.ts";
import type { Currency, Money } from "../lib/money.ts";
import { loadRate } from "./load-rate.ts";
import { resolveCurrency, resolveMonth } from "./search-params.ts";
import type { SearchParamValue } from "./search-params.ts";

type HomePageProps = Readonly<{
  searchParams: Promise<Readonly<Record<string, SearchParamValue>>>;
}>;

type StatProps = Readonly<{
  label: string;
  value: Money;
  swatchClassName: string;
}>;

const CURRENCIES: readonly Currency[] = ["ARS", "USD"];

const dashboardHref = (month: string, currency: Currency): string =>
  `/?month=${month}&currency=${currency}`;

const Stat = ({ label, value, swatchClassName }: StatProps) => (
  <div className="rounded-lg border border-neutral-200 bg-white p-4">
    <p className="flex items-center gap-2 text-sm text-neutral-600">
      <span aria-hidden="true" className={`inline-block h-3 w-3 rounded-sm ${swatchClassName}`} />
      {label}
    </p>
    <p className="mt-1 text-lg font-semibold">{formatMoney(value)}</p>
  </div>
);

const HomePage = async ({ searchParams }: HomePageProps) => {
  await connection();
  const params = await searchParams;
  const currentMonth = toIsoMonth(new Date());
  const month = resolveMonth(params["month"], currentMonth);
  const currency = resolveCurrency(params["currency"], "ARS");
  const database = getDatabase();
  const rate = await loadRate();
  const income = findIncomeForMonth(database, month);
  const goal = findInvestmentGoal(database);

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Link href={dashboardHref(shiftMonth(month, -1), currency)} aria-label="Mes anterior" className="px-2 hover:underline">
          ←
        </Link>
        <h1 className="text-2xl font-semibold">{formatDisplayMonth(month)}</h1>
        <Link href={dashboardHref(shiftMonth(month, 1), currency)} aria-label="Mes siguiente" className="px-2 hover:underline">
          →
        </Link>
      </div>
      <div className="flex overflow-hidden rounded-md border border-neutral-300 text-sm">
        {CURRENCIES.map((option) => (
          <Link
            key={option}
            href={dashboardHref(month, option)}
            aria-current={option === currency ? "true" : undefined}
            className={option === currency ? "bg-neutral-900 px-4 py-1.5 text-white" : "bg-white px-4 py-1.5 hover:bg-neutral-100"}
          >
            {option}
          </Link>
        ))}
      </div>
    </div>
  );

  if (rate === null) {
    return (
      <div className="space-y-6">
        {header}
        <section className={sectionClassName}>
          <p>
            No hay cotización disponible para calcular el resumen. Cargala manualmente en{" "}
            <Link href="/settings" className="underline">
              Configuración
            </Link>
            .
          </p>
        </section>
      </div>
    );
  }

  if (income === null) {
    return (
      <div className="space-y-6">
        {header}
        <section className={sectionClassName}>
          <p>
            Todavía no cargaste tu sueldo. Configuralo en{" "}
            <Link href="/settings" className="underline">
              Configuración
            </Link>{" "}
            para ver el resumen del mes.
          </p>
        </section>
      </div>
    );
  }

  const summary = summarizeMonth(
    {
      salary: income.amount,
      fixedExpenses: listActiveFixedExpenses(database).map((expense) => expense.amount),
      investmentGoal: goal ?? money(0, "ARS"),
      variableExpenses: listExpensesByMonth(database, month).map((expense) => ({
        amount: expense.amount,
        rateAtRegistration: expense.rateAtRegistration,
      })),
    },
    currency,
    rate.rate,
  );
  const breakdown = buildBreakdown(summary);
  const segments = [
    { key: "fixed", label: "Gastos fijos", percent: breakdown.fixed, className: "bg-slate-600" },
    { key: "investment", label: "Inversión", percent: breakdown.investment, className: "bg-teal-600" },
    { key: "variable", label: "Gastos del mes", percent: breakdown.variable, className: "bg-amber-500" },
    { key: "free", label: "Libre", percent: breakdown.free, className: "bg-emerald-300" },
  ] as const;
  const freeIsNegative = summary.free.amount < 0;

  return (
    <div className="space-y-6">
      {header}

      <section className={sectionClassName}>
        <p className="text-sm text-neutral-600">Libre para gastar</p>
        <p className={`text-4xl font-bold ${freeIsNegative ? "text-red-700" : "text-emerald-700"}`}>
          {formatMoney(summary.free)}
        </p>
        {freeIsNegative ? (
          <p role="alert" className="text-sm text-red-700">
            Estás gastando más de lo que ingresa este mes.
          </p>
        ) : null}
        <div
          role="img"
          aria-label="Distribución del sueldo del mes"
          className="flex h-4 w-full overflow-hidden rounded-full bg-neutral-200"
        >
          {segments.map((segment) => (
            <div key={segment.key} className={segment.className} style={{ width: `${segment.percent.toFixed(2)}%` }} />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Gastos fijos" value={summary.fixed} swatchClassName="bg-slate-600" />
        <Stat label="Inversión" value={summary.investment} swatchClassName="bg-teal-600" />
        <Stat label="Gastos del mes" value={summary.variable} swatchClassName="bg-amber-500" />
        <Stat label="Sueldo" value={summary.salary} swatchClassName="bg-neutral-300" />
      </section>

      <p className="text-xs text-neutral-600">
        Cotización: {formatMoney(money(Math.round(rate.rate * 100), "ARS"))} por dólar (
        {rate.source === "api" ? "MEP" : "manual"}
        {rate.stale ? `, desactualizada, del ${formatDisplayDate(rate.date)}` : ""}).
        {income.inherited ? ` Sueldo heredado de ${formatDisplayMonth(income.month)}.` : ""}
        {goal === null ? " Todavía no definiste un objetivo de inversión." : ""}
      </p>
    </div>
  );
};

export default HomePage;
