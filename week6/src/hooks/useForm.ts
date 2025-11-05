/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useMemo, useState } from "react";

type Errors<T> = Partial<Record<keyof T, string>>;

export function useForm<T extends Record<string, any>>(opts: {
  initialValues: T;
  validate: (values: T) => Errors<T>;
  onSubmit?: (values: T) => void | Promise<void>;
}) {
  const { initialValues, validate, onSubmit } = opts;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Errors<T>>({});
  const [touched, setTouched] = useState<Record<keyof T, boolean>>(
    Object.keys(initialValues).reduce((acc, k) => {
      (acc as any)[k] = false;
      return acc;
    }, {} as Record<keyof T, boolean>)
  );
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  }, []);

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const { name } = e.target;
      setTouched((t) => ({ ...t, [name]: true }));
      setErrors(validate(values));
    },
    [validate, values]
  );

  const isValid = useMemo(() => {
    const errs = validate(values);
    return Object.keys(errs).length === 0;
  }, [validate, values]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errs = validate(values);
      setErrors(errs);
      setTouched(
        Object.keys(values).reduce((acc, k) => {
          (acc as any)[k] = true;
          return acc;
        }, {} as Record<keyof T, boolean>)
      );
      if (Object.keys(errs).length > 0) return;

      if (!onSubmit) return;
      try {
        setSubmitting(true);
        await onSubmit(values);
      } finally {
        setSubmitting(false);
      }
    },
    [onSubmit, validate, values]
  );

  return { values, errors, touched, isValid, submitting, handleChange, handleBlur, handleSubmit, setValues };
}
