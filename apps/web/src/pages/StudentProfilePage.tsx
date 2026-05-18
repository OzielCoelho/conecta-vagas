import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { StudentProfileForm, type StudentProfileFormValues } from "../components/profile/StudentProfileForm";
import { getMyStudentProfile, updateStudentProfile } from "../services/students";

type StudentLocalDetails = {
  age: string;
  city: string;
  state: string;
  summary: string;
  title: string;
  semester: string;
  university: string;
  cr: string;
};

const defaultLocalDetails: StudentLocalDetails = {
  age: "22",
  city: "Manaus",
  state: "AM",
  summary:
    "Sou uma estudante dedicada, comunicativa e curiosa, com foco em desenvolvimento web e interesse em crescer em ambientes colaborativos.",
  title: "Estudante de Engenharia de Software",
  semester: "7º Semestre",
  university: "UFAM",
  cr: "8.9",
};

export function StudentProfilePage() {
  const { token, user } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<StudentProfileFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localDetails, setLocalDetails] = useState<StudentLocalDetails>(defaultLocalDetails);
  const [localSavedMessage, setLocalSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const storageKey = user ? `conecta_vagas_student_details_${user.id}` : null;
    if (storageKey) {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        try {
          setLocalDetails(JSON.parse(stored) as StudentLocalDetails);
        } catch {
          setLocalDetails(defaultLocalDetails);
        }
      }
    }

    setIsLoading(true);
    setError(null);

    getMyStudentProfile(token)
      .then((profile) => {
        setProfileId(profile.id);
        setInitialValues({
          name: profile.name,
          course: profile.course,
          skills: profile.skills.join(", "),
          availability: profile.availability,
          portfolio: profile.portfolio ?? "",
        });
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar o perfil.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  function saveLocalDetails() {
    if (!user) return;
    window.localStorage.setItem(`conecta_vagas_student_details_${user.id}`, JSON.stringify(localDetails));
    setLocalSavedMessage("Informações complementares salvas localmente.");
  }

  async function handleSubmit(data: Parameters<typeof updateStudentProfile>[1]) {
    if (!token || !profileId) {
      setError("Perfil indisponível no momento.");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const updatedProfile = await updateStudentProfile(profileId, data, token);
      setInitialValues({
        name: updatedProfile.name,
        course: updatedProfile.course,
        skills: updatedProfile.skills.join(", "),
        availability: updatedProfile.availability,
        portfolio: updatedProfile.portfolio ?? "",
      });
      setSuccessMessage("Perfil atualizado com sucesso.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível atualizar o perfil.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const content = useMemo(() => {
    if (isLoading) {
      return <div className="panel"><p>Carregando perfil...</p></div>;
    }

    if (!initialValues) {
      return <div className="panel"><p>{error ?? "Perfil não encontrado."}</p></div>;
    }

    return (
      <div className="profile-layout profile-layout--student">
        <div className="profile-main-stack">
          <div className="panel profile-hero-card">
            <div className="profile-hero-card__media">
              <div className="profile-avatar" aria-hidden="true">
                <span>RA</span>
              </div>
              <div className="profile-hero-card__info">
                <span className="panel__label">Aluno</span>
                <h2 className="profile-hero-card__name">{initialValues.name}</h2>
                <p className="profile-hero-card__title">{localDetails.title}</p>
                <div className="profile-meta-chips">
                  <span className="status-pill">Disponível para Estágio - {initialValues.availability}</span>
                  <span className="status-pill status-pill--highlight">Matching Score Geral: 96%</span>
                </div>
              </div>
            </div>

            <div className="profile-hero-card__actions">
              <button className="secondary-button" type="button">Visualizar Currículo (PDF)</button>
              <button className="secondary-button" type="button">Editar Perfil</button>
              <button className="primary-button" type="button">Ver Candidaturas</button>
            </div>
          </div>

          <div className="panel profile-panel">
            {successMessage ? <p className="form-success">{successMessage}</p> : null}
            <StudentProfileForm
              initialValues={initialValues}
              submitLabel="Salvar alterações"
              isSubmitting={isSubmitting}
              error={error}
              onSubmit={handleSubmit}
            />
          </div>

          <div className="content-grid profile-insight-grid">
            <article className="panel profile-description-card">
              <span className="panel__label">Habilidades</span>
              <h2>Skills em destaque</h2>
              <div className="skill-tags">
                {initialValues.skills.split(",").map((skill) => (
                  <span key={skill.trim()} className="skill-tag">{skill.trim()}</span>
                ))}
              </div>
            </article>

            <article className="panel profile-description-card">
              <span className="panel__label">Dados acadêmicos</span>
              <h2>Formação</h2>
              <div className="profile-academic-grid">
                <div><strong>Curso</strong><p>{initialValues.course}</p></div>
                <div><strong>Semestre</strong><p>{localDetails.semester}</p></div>
                <div><strong>Instituição</strong><p>{localDetails.university}</p></div>
                <div><strong>CR</strong><p>{localDetails.cr}</p></div>
              </div>
            </article>
          </div>
        </div>

        <div className="profile-side-stack">
          <aside className="panel profile-description-card">
            <span className="panel__label">Informações básicas</span>
            <div className="profile-basic-grid">
              <label className="field">
                <span>Idade</span>
                <input
                  value={localDetails.age}
                  onChange={(event) => setLocalDetails((current) => ({ ...current, age: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Cidade</span>
                <input
                  value={localDetails.city}
                  onChange={(event) => setLocalDetails((current) => ({ ...current, city: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Estado</span>
                <input
                  value={localDetails.state}
                  onChange={(event) => setLocalDetails((current) => ({ ...current, state: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Título principal</span>
                <input
                  value={localDetails.title}
                  onChange={(event) => setLocalDetails((current) => ({ ...current, title: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Semestre</span>
                <input
                  value={localDetails.semester}
                  onChange={(event) => setLocalDetails((current) => ({ ...current, semester: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Instituição</span>
                <input
                  value={localDetails.university}
                  onChange={(event) => setLocalDetails((current) => ({ ...current, university: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>CR</span>
                <input
                  value={localDetails.cr}
                  onChange={(event) => setLocalDetails((current) => ({ ...current, cr: event.target.value }))}
                />
              </label>
            </div>
          </aside>

          <aside className="panel profile-description-card">
            <span className="panel__label">Descrição</span>
            <h2>Apresentação do candidato</h2>
            <p>
              Espaço pensado para o candidato escrever uma breve descrição sobre suas qualidades, objetivos,
              pontos fortes e o que busca no estágio.
            </p>
            <textarea
              className="profile-description-card__textarea"
              rows={8}
              value={localDetails.summary}
              onChange={(event) => setLocalDetails((current) => ({ ...current, summary: event.target.value }))}
              placeholder="Ex.: Sou uma estudante dedicada, com interesse em desenvolvimento web, boa comunicação e vontade de aprender em ambientes colaborativos..."
            />
            {localSavedMessage ? <p className="form-success">{localSavedMessage}</p> : null}
            <button className="secondary-button" type="button" onClick={saveLocalDetails}>
              Salvar informações extras
            </button>
          </aside>
        </div>
      </div>
    );
  }, [error, handleSubmit, initialValues, isLoading, isSubmitting, localDetails, localSavedMessage, successMessage]);

  return (
    <section className="page-section profile-page">
      <header className="page-header">
        <div>
          <span className="page-eyebrow">Meu perfil</span>
          <h1>Perfil do aluno</h1>
          <p>Mantenha seu curso, habilidades, disponibilidade e portfólio atualizados.</p>
        </div>
      </header>

      {content}
    </section>
  );
}
