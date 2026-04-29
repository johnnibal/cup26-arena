"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { updateSupporterNote, type ActionResult } from "@/lib/actions/profile";

const MAX = 500;

type SupporterNoteFormProps = {
  initialValue: string;
};

type FormState = ActionResult & { savedAt: number | null };

const EMPTY_STATE: FormState = { ok: true, savedAt: null };

async function formAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await updateSupporterNote(formData);
  if (result.ok) {
    return { ok: true, savedAt: Date.now() };
  }
  return { ...result, savedAt: null };
}

export function SupporterNoteForm({ initialValue }: SupporterNoteFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(formAction, EMPTY_STATE);

  useEffect(() => {
    if (state.ok && state.savedAt) {
      router.refresh();
    }
  }, [state.ok, state.savedAt, router]);

  return (
    <form action={action} className="scheme-dark flex flex-col gap-2">
      <label
        htmlFor="supporter_note"
        className="text-xs font-semibold uppercase tracking-wide text-zinc-200"
      >
        Supporter note{" "}
        <span className="font-normal normal-case text-zinc-400">
          (optional, 0–{MAX} characters)
        </span>
      </label>
      <p className="text-xs text-zinc-500">
        A short chant, motto, or why you back your team is shown on your profile card.
      </p>
      <textarea
        id="supporter_note"
        name="supporter_note"
        defaultValue={initialValue}
        maxLength={MAX}
        rows={4}
        aria-describedby="supporter_note_hint"
        placeholder="e.g. It’s coming home — sing it loud for the Three Lions."
        className="focus:ring-team-primary/20 min-h-[5.5rem] w-full resize-y rounded-xl border border-zinc-600/35 bg-[#121722] px-3 py-2.5 text-sm leading-relaxed text-zinc-100 shadow-inner outline-none transition placeholder:text-zinc-600 focus:border-team-primary/60 focus:ring-2"
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-team-primary px-5 text-sm font-semibold text-team-ink shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save note"}
        </button>
      </div>
      <p id="supporter_note_hint" className="sr-only">
        Optional. Leave blank to hide the note on your profile card. Maximum {MAX} characters.
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
