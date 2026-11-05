"use client";

import { useRef, useState } from "react";

type CategoryBarRow = Readonly<{
  key: string;
  label: string;
  valueLabel: string;
  shareLabel: string;
  countLabel: string;
  widthPercent: number;
  isOther: boolean;
}>;

type CategoryBarsProps = Readonly<{
  rows: readonly CategoryBarRow[];
  totalLabel: string;
  description: string;
}>;

type TooltipState = Readonly<{
  index: number;
  x: number;
  y: number;
}>;

const TOOLTIP_EDGE_PADDING = 96;

const describeRow = (row: CategoryBarRow): string =>
  `${row.label}: ${row.valueLabel}, ${row.shareLabel} del total, ${row.countLabel}`;

const CategoryBars = ({ rows, totalLabel, description }: CategoryBarsProps) => {
  const figureRef = useRef<HTMLElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const showTooltip = (index: number, clientX: number, clientY: number): void => {
    const box = figureRef.current?.getBoundingClientRect();
    if (box === undefined) {
      return;
    }
    const x = Math.min(Math.max(clientX - box.left, TOOLTIP_EDGE_PADDING), box.width - TOOLTIP_EDGE_PADDING);
    setTooltip({ index, x, y: clientY - box.top });
  };

  const showForElement = (index: number, element: HTMLElement): void => {
    const box = element.getBoundingClientRect();
    showTooltip(index, box.left + box.width / 2, box.top);
  };

  const activeRow = tooltip === null ? undefined : rows[tooltip.index];

  return (
    <figure ref={figureRef} className="relative m-0" aria-label={description}>
      <ul className="m-0 list-none p-0" onPointerLeave={() => setTooltip(null)}>
        {rows.map((row, index) => {
          const active = tooltip?.index === index;
          return (
            <li
              key={row.key}
              tabIndex={0}
              aria-label={describeRow(row)}
              className={`flex h-9 items-center gap-3 rounded-sm outline-offset-2 focus-visible:outline-2 focus-visible:outline-(--chart-series-1) ${active ? "bg-neutral-100" : ""}`}
              onPointerMove={(event) => showTooltip(index, event.clientX, event.clientY)}
              onFocus={(event) => showForElement(index, event.currentTarget)}
              onBlur={() => setTooltip(null)}
            >
              <span className="w-28 shrink-0 truncate text-sm text-neutral-700 sm:w-36" title={row.label}>
                {row.label}
              </span>
              <span className="flex h-full min-w-0 flex-1 items-center gap-2 border-l border-(--chart-axis)">
                <span
                  aria-hidden="true"
                  className={`block h-4 min-w-0.5 rounded-r-[4px] ${row.isOther ? "bg-(--chart-other)" : "bg-(--chart-series-1)"} ${active ? "brightness-110" : ""}`}
                  style={{ width: `${row.widthPercent}%` }}
                />
                <span className="whitespace-nowrap text-sm font-medium text-neutral-900">{row.valueLabel}</span>
              </span>
            </li>
          );
        })}
      </ul>

      {tooltip !== null && activeRow !== undefined ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 w-max max-w-64 -translate-x-1/2 -translate-y-full rounded-md border border-neutral-200 bg-white px-3 py-2 shadow-md"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
        >
          <p className="text-base font-semibold text-neutral-900">{activeRow.valueLabel}</p>
          <p className="text-xs text-neutral-600">
            {activeRow.label} · {activeRow.shareLabel} del total
          </p>
          <p className="text-xs text-neutral-600">{activeRow.countLabel}</p>
        </div>
      ) : null}

      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-neutral-700 hover:underline">Ver como tabla</summary>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-600">
              <th className="py-1 font-medium">Categoría</th>
              <th className="py-1 text-right font-medium">Monto</th>
              <th className="py-1 text-right font-medium">% del total</th>
              <th className="py-1 text-right font-medium">Gastos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-neutral-100">
                <td className="py-1">{row.label}</td>
                <td className="py-1 text-right tabular-nums">{row.valueLabel}</td>
                <td className="py-1 text-right tabular-nums">{row.shareLabel}</td>
                <td className="py-1 text-right tabular-nums">{row.countLabel}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th className="py-1 text-left font-medium">Total</th>
              <td className="py-1 text-right font-medium tabular-nums">{totalLabel}</td>
              <td />
              <td />
            </tr>
          </tfoot>
        </table>
      </details>
    </figure>
  );
};

export default CategoryBars;
export type { CategoryBarRow };
