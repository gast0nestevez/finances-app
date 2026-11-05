import { revalidatePath } from "next/cache";
import type { ZodType } from "zod";
import { DuplicateCategoryError } from "../db/categories.ts";
import type { ActionState } from "../components/action-state.ts";
import { NoExchangeRateAvailableError } from "../services/exchange-rate-service.ts";

const failure = (message: string): ActionState => ({ status: "error", message });

const describeError = (error: unknown): string =>
  error instanceof DuplicateCategoryError
    ? "Ya existe una categoría con ese nombre"
    : error instanceof NoExchangeRateAvailableError
      ? "No hay cotización disponible. Cargala manualmente en Configuración."
      : "No se pudo guardar, intentá de nuevo";

const runAction = async <T>(
  schema: ZodType<T>,
  formData: FormData,
  successMessage: string,
  paths: readonly string[],
  execute: (input: T) => void | Promise<void>,
): Promise<ActionState> => {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }
  try {
    await execute(parsed.data);
  } catch (error: unknown) {
    return failure(describeError(error));
  }
  paths.forEach((path) => revalidatePath(path));
  return { status: "success", message: successMessage };
};

export { runAction };
