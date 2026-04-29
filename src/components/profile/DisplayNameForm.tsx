"use client";

import { useActionState } from "react";

import { updateDisplayName, type ActionResult } from "@/lib/actions/profile";

type DisplayNameFormProps = {
  initialValue: string;
};

type FormState = ActionResult & { savedAt: number | null };

const EMPTY_STATE: FormState = { ok: true, savedAt: null };

async function action(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await updateDisplayName(formData);
  if (result.ok) {
    return { ok: true, savedAt: Date.now() };
  }
  return { ...result, savedAt: null };
}

export function DisplayNameForm({ initialValue }: DisplayNameFormProps) {
  const [state, formAction, pending] = useActionState(action, EMPTY_STATE);

  return (
    <form action={formAction} className="scheme-dark flex flex-col gap-2">
      <label
        htmlFor="display_name"
        className="text-xs font-semibold uppercase tracking-wide text-zinc-200"
      >
        Display name{" "}
        <span className="font-normal normal-case text-zinc-400">(1–40 characters)</span>
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="display_name"
          name="display_name"
          defaultValue={initialValue}
          minLength={1}
          maxLength={40}
          required
          autoComplete="nickname"
          aria-describedby="display_name_hint"
          className="focus:ring-team-primary/20 flex-1 rounded-xl border border-zinc-600/35 bg-[#121722] px-3 py-2.5 text-sm text-zinc-100 shadow-inner outline-none transition placeholder:text-zinc-500 focus:border-team-primary/60 focus:ring-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-team-primary px-5 text-sm font-semibold text-team-ink shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save"}
        </button>
      </div>
      <p id="display_name_hint" className="sr-only">
        Required. Trimmed name must be between 1 and 40 characters.
      </p>
      {state.ok && state.savedAt ? (
        <p className="text-xs text-emerald-400" role="status">
          Saved.
        </p>
      ) : null}
      {!state.ok ? (
        <p role="alert" className="text-xs text-rose-400">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
