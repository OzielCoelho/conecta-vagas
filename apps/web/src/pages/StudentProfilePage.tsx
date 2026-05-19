import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function StudentProfilePage() {
  const { token, user, refreshCurrentUser } = useAuth();
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
          photoUrl: profile.photoUrl ?? "",
        });
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar o perfil.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token, user]);

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
        photoUrl: updatedProfile.photoUrl ?? "",
      });
      await refreshCurrentUser();
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
      <div className="profile-layout profile-layout--student profile-layout--refined">
        <div className="profile-main-stack">
          <section className="panel profile-hero-card profile-hero-card--refined profile-hero-card--student-modern">
            <div className="profile-hero-card__media profile-hero-card__media--student">
              {initialValues.photoUrl ? (
                <img
                  className="profile-avatar profile-avatar--image"
                  src={initialValues.photoUrl}
                  alt={`Foto de ${initialValues.name}`}
                />
              ) : (
                <div className="profile-avatar" aria-hidden="true">
                  <span>{getInitials(initialValues.name)}</span>
                </div>
              )}

              <div className="profile-hero-card__info">
                <span className="panel__label">Candidato</span>
                <h1 className="profile-hero-card__name">{initialValues.name}</h1>
                <p className="profile-hero-card__title">{localDetails.title}</p>
                <div className="profile-meta-chips">
                  <span className="status-pill">Disponível para estágio • {initialValues.availability}</span>
                  <span className="status-pill status-pill--highlight">Perfil forte para vagas de entrada</span>
                </div>
              </div>
            </div>

            <div className="profile-hero-card__meta-grid">
              <article className="profile-info-card">
                <span className="panel__label">Localidade</span>
                <strong>{localDetails.city} • {localDetails.state}</strong>
                <p>Disponibilidade alinhada para oportunidades locais e remotas.</p>
              </article>
              <article className="profile-info-card">
                <span className="panel__label">Formação</span>
                <strong>{localDetails.university}</strong>
                <p>{localDetails.semester} • CR {localDetails.cr}</p>
              </article>
              <article className="profile-info-card">
                <span className="panel__label">Objetivo</span>
                <strong>Estágio com crescimento</strong>
                <p>Perfil com foco em evolução técnica e experiência prática.</p>
              </article>
            </div>

            <div className="profile-hero-card__actions">
              <Link className="primary-button" to="/perfil/aluno/candidaturas">Ver candidaturas</Link>
              <button className="secondary-button" type="button" onClick={saveLocalDetails}>Salvar resumo extra</button>
            </div>
          </section>

          <section className="content-grid profile-insight-grid profile-insight-grid--refined">
            <article className="panel profile-stat-card">
              <span className="panel__label">Empregabilidade</span>
              <strong>12 vagas</strong>
              <p>Compatíveis com suas habilidades e curso.</p>
            </article>
            <article className="panel profile-stat-card">
              <span className="panel__label">Candidaturas</span>
              <strong>5 processos</strong>
              <p>Acompanhamento ativo no seu painel.</p>
            </article>
            <article className="panel profile-stat-card">
              <span className="panel__label">Curso</span>
              <strong>{localDetails.semester}</strong>
              <p>{initialValues.course}</p>
            </article>
          </section>

          <section className="panel profile-panel profile-panel--refined">
            <div className="profile-panel__heading">
              <div>
                <span className="panel__label">Edição do perfil</span>
                <h2>Atualize seus dados profissionais</h2>
              </div>
            </div>
            {successMessage ? <p className="form-success">{successMessage}</p> : null}
            <StudentProfileForm
              initialValues={initialValues}
              submitLabel="Salvar alterações"
              isSubmitting={isSubmitting}
              error={error}
              onSubmit={handleSubmit}
            />
          </section>

          <section className="content-grid profile-insight-grid profile-insight-grid--details profile-insight-grid--details-extended">
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
              <div className="profile-academic-grid profile-academic-grid--compact">
                <div><strong>Curso</strong><p>{initialValues.course}</p></div>
                <div><strong>Semestre</strong><p>{localDetails.semester}</p></div>
                <div><strong>Instituição</strong><p>{localDetails.university}</p></div>
                <div><strong>CR</strong><p>{localDetails.cr}</p></div>
              </div>
            </article>

            <article className="panel profile-description-card profile-link-card">
              <span className="panel__label">Portfólio</span>
              <h2>Link profissional</h2>
              <p>{initialValues.portfolio ? "Mantenha seu material atualizado para aumentar a confiança das empresas." : "Adicione um portfólio para tornar seu perfil ainda mais completo."}</p>
              <span className="profile-link-card__value">{initialValues.portfolio || "Nenhum link informado ainda"}</span>
            </article>
          </section>
        </div>

        <div className="profile-side-stack profile-side-stack--refined">
          <aside className="panel profile-description-card profile-description-card--summary">
            <span className="panel__label">Apresentação</span>
            <h2>Resumo profissional</h2>
            <p>{localDetails.summary}</p>
            <div className="profile-summary-list">
              <div className="profile-summary-list__item">
                <span>Idade</span>
                <strong>{localDetails.age} anos</strong>
              </div>
              <div className="profile-summary-list__item">
                <span>Localidade</span>
                <strong>{localDetails.city} • {localDetails.state}</strong>
              </div>
              <div className="profile-summary-list__item">
                <span>Instituição</span>
                <strong>{localDetails.university}</strong>
              </div>
            </div>
          </aside>

          <aside className="panel profile-description-card">
            <span className="panel__label">Informações básicas</span>
            <div className="profile-basic-grid profile-basic-grid--refined">
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
            {localSavedMessage ? <p className="form-success">{localSavedMessage}</p> : null}
            <button className="secondary-button" type="button" onClick={saveLocalDetails}>
              Salvar informações extras
            </button>
          </aside>
        </div>
      </div>
    );
  }, [error, initialValues, isLoading, isSubmitting, localDetails, localSavedMessage, successMessage, token]);

  return (
    <section className="page-section profile-page student-profile-page student-profile-page--refined">
      {content}
    </section>
  );
}
