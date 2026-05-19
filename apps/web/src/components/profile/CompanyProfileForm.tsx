import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { CreateCompanyProfileInput } from "../../services/companies";

export type CompanyProfileFormValues = {
  name: string;
  about: string;
};

type CompanyProfileFormProps = {
  initialValues?: CompanyProfileFormValues;
  submitLabel: string;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (data: CreateCompanyProfileInput) => Promise<void>;
};

const defaultValues: CompanyProfileFormValues = {
  name: "",
  about: "",
};

export function CompanyProfileForm({
  initialValues,
  submitLabel,
  isSubmitting,
  error,
  onSubmit,
}: CompanyProfileFormProps) {
  const values = useMemo(() => initialValues ?? defaultValues, [initialValues]);
  const [name, setName] = useState(values.name);
  const [about, setAbout] = useState(values.about);

  useEffect(() => {
    setName(values.name);
    setAbout(values.about);
  }, [values]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      name,
      about: about || undefined,
    });
  }

  return (
    <form className="auth-form profile-form profile-form--company" onSubmit={handleSubmit}>
      <div className="profile-form__grid profile-form__grid--company">
        <label className="field profile-form__field--full">
          <span>Nome da empresa</span>
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>

        <label className="field profile-form__field--full">
          <span>Descrição / sobre</span>
          <textarea value={about} onChange={(event) => setAbout(event.target.value)} rows={6} />
        </label>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="profile-form__actions">
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
