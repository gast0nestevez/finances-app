"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import { idleState } from "./action-state.ts";
import type { ActionState } from "./action-state.ts";

type ActionFormProps = Readonly<{
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  children: ReactNode;
}>;

const ActionForm = ({ action, submitLabel, children }: ActionFormProps) => {
  const [state, formAction, pending] = useActionState(action, idleState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      {children}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Guardando..." : submitLabel}
      </button>
      {state.status === "success" ? (
        <p role="status" className="w-full text-sm text-green-700">
          {state.message}
        </p>
      ) : null}
      {state.status === "error" ? (
        <p role="alert" className="w-full text-sm text-red-700">
          {state.message}
        </p>
      ) : null}
    </form>
  );
};

export default ActionForm;
