import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { CreateStudentProfileInput } from "../../services/students";

export type StudentProfileFormValues = {
  name: string;
  course: string;
  skills: string;
  availability: string;
  portfolio: string;
  photoUrl: string;
};

type StudentProfileFormProps = {
  initialValues?: StudentProfileFormValues;
  submitLabel: string;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (data: CreateStudentProfileInput) => Promise<void>;
};

const defaultValues: StudentProfileFormValues = {
  name: "",
  course: "",
  skills: "",
  availability: "",
  portfolio: "",
  photoUrl: "",
};

export function StudentProfileForm({
  initialValues,
  submitLabel,
  isSubmitting,
  error,
  onSubmit,
}: StudentProfileFormProps) {
  const values = useMemo(() => initialValues ?? defaultValues, [initialValues]);
  const [name, setName] = useState(values.name);
  const [course, setCourse] = useState(values.course);
  const [skills, setSkills] = useState(values.skills);
  const [availability, setAvailability] = useState(values.availability);
  const [portfolio, setPortfolio] = useState(values.portfolio);
  const [photoUrl, setPhotoUrl] = useState(values.photoUrl);

  useEffect(() => {
    setName(values.name);
    setCourse(values.course);
    setSkills(values.skills);
    setAvailability(values.availability);
    setPortfolio(values.portfolio);
    setPhotoUrl(values.photoUrl);
  }, [values]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      name,
      course,
      skills: skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      availability,
      portfolio: portfolio || undefined,
      photoUrl: photoUrl || undefined,
    });
  }

  return (
    <form className="auth-form profile-form profile-form--student" onSubmit={handleSubmit}>
      <div className="profile-form__grid">
        <label className="field">
          <span>Nome</span>
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>

        <label className="field">
          <span>Curso</span>
          <input value={course} onChange={(event) => setCourse(event.target.value)} required />
        </label>

        <label className="field">
          <span>Habilidades</span>
          <input
            value={skills}
            onChange={(event) => setSkills(event.target.value)}
            placeholder="React, Node, SQL"
            required
          />
        </label>

        <label className="field">
          <span>Disponibilidade</span>
          <input value={availability} onChange={(event) => setAvailability(event.target.value)} required />
        </label>
      </div>

      <label className="field profile-form__field--full">
        <span>Foto por URL</span>
        <input
          type="url"
          value={photoUrl}
          onChange={(event) => setPhotoUrl(event.target.value)}
          placeholder="https://images.unsplash.com/..."
        />
      </label>

      <label className="field profile-form__field--full">
        <span>Portfólio / link</span>
        <input value={portfolio} onChange={(event) => setPortfolio(event.target.value)} placeholder="https://seu-portfolio.com" />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="profile-form__actions">
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
