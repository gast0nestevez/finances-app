type ActionState =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "success"; message: string }>
  | Readonly<{ status: "error"; message: string }>;

const idleState: ActionState = { status: "idle" };

export { idleState };
export type { ActionState };
