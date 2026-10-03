'use client';
import { validate } from '@tp/shared/validation';
import { useCallback, useRef, useState } from 'react';
import type { ZodTypeAny } from 'zod';

/**
 * Browser-side validation with the same zod schema the API uses.
 * A field is checked when it loses focus, but only once the person has typed in it: an
 * autofocused field that loses focus as a dialog opens, or a field tabbed past, stays quiet
 * until submit. After its first check it re-checks on every keystroke, so an error disappears
 * the moment it's fixed. `validateAll` runs on submit and checks everything.
 */
export function useFormValidation(schema: ZodTypeAny) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const edited = useRef(new Set<string>());
  const touched = useRef(new Set<string>());

  const check = useCallback(
    (values: unknown, key: string) => {
      const message = validate(schema, values)[key];
      setErrors((prev) => {
        if (prev[key] === message) return prev;
        const next = { ...prev };
        if (message) next[key] = message;
        else delete next[key];
        return next;
      });
    },
    [schema],
  );

  const onBlur = useCallback(
    (values: unknown, key: string) => {
      if (!edited.current.has(key)) return;
      touched.current.add(key);
      check(values, key);
    },
    [check],
  );

  const onChange = useCallback(
    (values: unknown, key: string) => {
      edited.current.add(key);
      if (touched.current.has(key)) check(values, key);
    },
    [check],
  );

  /** Checks every field; returns true when the form can be sent. */
  const validateAll = useCallback(
    (values: unknown) => {
      const all = validate(schema, values);
      Object.keys(all).forEach((k) => touched.current.add(k));
      setErrors(all);
      return Object.keys(all).length === 0;
    },
    [schema],
  );

  return { errors, setErrors, onBlur, onChange, validateAll };
}
