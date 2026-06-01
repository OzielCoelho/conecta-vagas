import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  availabilityOptions,
  type AvailabilityOption,
  type CreateStudentProfileInput,
} from "../../services/students";
import { readImageAsCompressedDataUrl } from "../../utils/image";

export type StudentProfileFormValues = {
  firstName: string;
  lastName: string;
  course: string;
  skills: string;
  availability: AvailabilityOption[];
  headline: string;
  summary: string;
  city: string;
  state: string;
  semester: string;
  university: string;
  cr: string;
  portfolio: string;
  photoUrl: string;
};

type StudentProfileFormProps = {
  initialValues?: StudentProfileFormValues;
  submitLabel: string;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (data: CreateStudentProfileInput) => Promise<void>;
  onPhotoChange?: (photoUrl: string) => void;
};

const defaultValues: StudentProfileFormValues = {
  firstName: "",
  lastName: "",
  course: "",
  skills: "",
  availability: [],
  headline: "",
  summary: "",
  city: "",
  state: "",
  semester: "",
  university: "",
  cr: "",
  portfolio: "",
  photoUrl: "",
};

function buildFullName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

export function StudentProfileForm({
  initialValues,
  submitLabel,
  isSubmitting,
  error,
  onSubmit,
  onPhotoChange,
}: StudentProfileFormProps) {
  const values = useMemo(() => initialValues ?? defaultValues, [initialValues]);
  const [firstName, setFirstName] = useState(values.firstName);
  const [lastName, setLastName] = useState(values.lastName);
  const [course, setCourse] = useState(values.course);
  const [skills, setSkills] = useState(values.skills);
  const [availability, setAvailability] = useState<AvailabilityOption[]>(values.availability);
  const [headline, setHeadline] = useState(values.headline);
  const [summary, setSummary] = useState(values.summary);
  const [city, setCity] = useState(values.city);
  const [state, setState] = useState(values.state);
  const [semester, setSemester] = useState(values.semester);
  const [university, setUniversity] = useState(values.university);
  const [cr, setCr] = useState(values.cr);
  const [portfolio, setPortfolio] = useState(values.portfolio);
  const [photoUrl, setPhotoUrl] = useState(values.photoUrl);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setFirstName(values.firstName);
    setLastName(values.lastName);
    setCourse(values.course);
    setSkills(values.skills);
    setAvailability(values.availability);
    setHeadline(values.headline);
    setSummary(values.summary);
    setCity(values.city);
    setState(values.state);
    setSemester(values.semester);
    setUniversity(values.university);
    setCr(values.cr);
    setPortfolio(values.portfolio);
    setPhotoUrl(values.photoUrl);
  }, [values]);

  function toggleAvailability(option: AvailabilityOption) {
    setAvailability((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option]
    );
  }

  async function handlePhotoInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoError("Selecione um arquivo de imagem válido.");
      event.target.value = "";
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setPhotoError("A imagem é muito grande. Selecione uma imagem de até 25MB.");
      event.target.value = "";
      return;
    }

    try {
      const nextPhotoUrl = await readImageAsCompressedDataUrl(file);
      setPhotoUrl(nextPhotoUrl);
      setPhotoError(null);
      onPhotoChange?.(nextPhotoUrl);
    } catch (uploadError) {
      setPhotoError(uploadError instanceof Error ? uploadError.message : "Não foi possível carregar a imagem.");
    } finally {
      // Permite reselecionar o mesmo arquivo (o onChange não dispara para o mesmo value).
      event.target.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = buildFullName(firstName, lastName);

    await onSubmit({
      name,
      course: course.trim(),
      skills: skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      availability,
      headline: headline.trim(),
      summary: summary.trim(),
      city: city.trim(),
      state: state.trim(),
      semester: semester.trim(),
      university: university.trim(),
      cr: cr.trim(),
      portfolio: portfolio.trim(),
      photoUrl: photoUrl.trim(),
    });
  }

  return (
    <form className="auth-form profile-form profile-form--student" onSubmit={handleSubmit}>
      <div className="profile-form__photo-upload">
        <button
          className="profile-form__photo-trigger"
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          {photoUrl ? (
            <img className="profile-form__photo-preview" src={photoUrl} alt="Pré-visualização da foto" />
          ) : (
            <span className="profile-form__photo-placeholder">Foto</span>
          )}
          <span className="profile-form__photo-badge">Trocar foto</span>
        </button>
        <input
          id="student-photo-upload-trigger"
          ref={fileInputRef}
          className="profile-form__file-input"
          type="file"
          accept="image/*"
          onChange={handlePhotoInput}
        />
        <div>
          <strong>Foto do perfil</strong>
          <p className="profile-form__hint">Clique no avatar para enviar uma foto. A imagem é ajustada automaticamente.</p>
          {photoError ? <p className="form-error">{photoError}</p> : null}
        </div>
      </div>

      <div className="profile-form__grid">
        <label className="field">
          <span>Nome</span>
          <input value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
        </label>

        <label className="field">
          <span>Sobrenome</span>
          <input value={lastName} onChange={(event) => setLastName(event.target.value)} required />
        </label>

        <label className="field">
          <span>Curso</span>
          <input value={course} onChange={(event) => setCourse(event.target.value)} required />
        </label>

        <label className="field">
          <span>Título profissional</span>
          <input
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            placeholder="Desenvolvedora em formação"
          />
        </label>

        <label className="field">
          <span>Cidade</span>
          <input value={city} onChange={(event) => setCity(event.target.value)} />
        </label>

        <label className="field">
          <span>Estado</span>
          <input value={state} onChange={(event) => setState(event.target.value)} />
        </label>

        <label className="field">
          <span>Semestre / período</span>
          <input value={semester} onChange={(event) => setSemester(event.target.value)} />
        </label>

        <label className="field">
          <span>Instituição</span>
          <input value={university} onChange={(event) => setUniversity(event.target.value)} />
        </label>

        <label className="field">
          <span>CR</span>
          <input value={cr} onChange={(event) => setCr(event.target.value)} placeholder="8.9" />
        </label>

        <label className="field">
          <span>Portfólio</span>
          <input value={portfolio} onChange={(event) => setPortfolio(event.target.value)} placeholder="https://seu-portfolio.com" />
        </label>
      </div>

      <label className="field profile-form__field--full">
        <span>Habilidades</span>
        <input
          value={skills}
          onChange={(event) => setSkills(event.target.value)}
          placeholder="React, Node, SQL"
          required
        />
      </label>

      <fieldset className="profile-form__field-group">
        <legend>Disponibilidade</legend>
        <div className="profile-form__availability-grid">
          {availabilityOptions.map((option) => {
            const active = availability.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                className={active ? "profile-form__availability-option profile-form__availability-option--active" : "profile-form__availability-option"}
                onClick={() => toggleAvailability(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="field profile-form__field--full">
        <span>Resumo profissional</span>
        <textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          rows={5}
          placeholder="Conte brevemente como você gosta de trabalhar e o que busca aprender."
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="profile-form__actions">
        <button className="primary-button" type="submit" disabled={isSubmitting || availability.length === 0}>
          {isSubmitting ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
