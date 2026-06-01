import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import {
  getApplicationsByJob,
  getApplicationStatusLabel,
  getApplicationStatusTone,
  type CompanyApplication,
} from "../services/applications";
import {
  availabilityOptions,
  createJob,
  getAvailabilityLabel,
  getMyCompanyJobs,
  updateJob,
  type CreateJobInput,
  type JobItem,
  type JobModel,
} from "../services/jobs";
import type { AvailabilityOption } from "../services/students";

type RankedCandidate = CompanyApplication & { jobTitle: string };

const skillChipTones = ["blue", "violet", "emerald", "amber", "rose", "cyan"] as const;

function getScoreTone(score: number) {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  if (score >= 25) return "low";
  return "weak";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function CompanyDashboardPage() {
  const { token, user } = useAuth();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [candidates, setCandidates] = useState<RankedCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [model, setModel] = useState<JobModel>("REMOTE");
  const [location, setLocation] = useState("");
  const [course, setCourse] = useState("");
  const [availability, setAvailability] = useState<AvailabilityOption | "">("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token || user?.role !== "COMPANY") {
      setJobs([]);
      setCandidates([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    getMyCompanyJobs(token)
      .then(async (companyJobs) => {
        setJobs(companyJobs);

        const results = await Promise.allSettled(
          companyJobs.map((job) => getApplicationsByJob(job.id, token))
        );

        const ranked: RankedCandidate[] = [];
        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            result.value.forEach((application) => {
              ranked.push({ ...application, jobTitle: companyJobs[index].title });
            });
          }
        });

        ranked.sort((first, second) => second.score - first.score);
        setCandidates(ranked);
      })
      .catch(() => {
        setJobs([]);
        setCandidates([]);
      })
      .finally(() => setIsLoading(false));
  }, [token, user]);

  const stats = useMemo(() => {
    const inTriage = candidates.filter((item) => item.status === "SENT" || item.status === "UNDER_REVIEW").length;
    return [
      { label: "Vagas publicadas", value: String(jobs.length), tone: "blue" as const, icon: "💼" },
      { label: "Vagas ativas", value: String(jobs.filter((job) => job.isActive).length), tone: "emerald" as const, icon: "🟢" },
      { label: "Candidaturas", value: String(candidates.length), tone: "violet" as const, icon: "👥" },
      { label: "Em triagem", value: String(inTriage), tone: "amber" as const, icon: "🔍" },
    ];
  }, [jobs, candidates]);

  const topCandidates = candidates.slice(0, 6);

  function openNewJobForm() {
    setSelectedJobId("");
    setTitle("");
    setDescription("");
    setSkills("");
    setModel("REMOTE");
    setLocation("");
    setCourse("");
    setAvailability("");
    setError(null);
    setSuccessMessage(null);
    setShowForm(true);
  }

  function openEditJobForm(job: JobItem) {
    setSelectedJobId(job.id);
    setTitle(job.title);
    setDescription(job.description);
    setSkills(job.skills.join(", "));
    setModel(job.model);
    setLocation(job.location ?? "");
    setCourse(job.course ?? "");
    setAvailability(job.availability ?? "");
    setError(null);
    setSuccessMessage(null);
    setShowForm(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError("Sessão inválida. Faça login novamente.");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const payload: CreateJobInput = {
      title,
      description,
      skills: skills.split(",").map((skill) => skill.trim()).filter(Boolean),
      model,
      location: location || undefined,
      course: course || undefined,
      availability: availability || undefined,
    };

    try {
      const savedJob = selectedJobId
        ? await updateJob(selectedJobId, payload, token)
        : await createJob(payload, token);

      setJobs((current) => {
        const hasJob = current.some((job) => job.id === savedJob.id);
        if (hasJob) {
          return current.map((job) => (job.id === savedJob.id ? savedJob : job));
        }
        return [savedJob, ...current];
      });

      setSelectedJobId(savedJob.id);
      setSuccessMessage(selectedJobId ? "Vaga atualizada com sucesso." : "Vaga publicada com sucesso.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível salvar a vaga.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleJobStatus(job: JobItem) {
    if (!token) return;

    try {
      const updatedJob = await updateJob(job.id, {
        title: job.title,
        description: job.description,
        skills: job.skills,
        model: job.model,
        location: job.location ?? undefined,
        course: job.course ?? undefined,
        availability: job.availability ?? undefined,
        isActive: !job.isActive,
      }, token);

      setJobs((current) => current.map((item) => (item.id === updatedJob.id ? updatedJob : item)));
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Não foi possível atualizar o status da vaga.");
    }
  }

  return (
    <section className="page-section dashboard-page">
      <header className="dashboard-hero dashboard-hero--company">
        <div className="dashboard-hero__copy">
          <span className="dashboard-hero__eyebrow">Dashboard da Empresa</span>
          <h1>Visão geral das suas vagas e talentos</h1>
          <p>Acompanhe candidaturas ranqueadas pelo Matching Score e gerencie suas oportunidades em um só lugar.</p>
        </div>
        <div className="dashboard-hero__actions">
          <button className="dashboard-hero__button" type="button" onClick={openNewJobForm}>
            + Abrir nova vaga
          </button>
        </div>
      </header>

      <section className="dashboard-stats">
        {stats.map((item) => (
          <article key={item.label} className={`dashboard-stat dashboard-stat--${item.tone}`}>
            <span className="dashboard-stat__icon" aria-hidden="true">{item.icon}</span>
            <div className="dashboard-stat__body">
              <span className="dashboard-stat__label">{item.label}</span>
              <strong className="dashboard-stat__value">{item.value}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-grid dashboard-grid--company">
        <article className="panel dashboard-card dashboard-card--ranking">
          <div className="dashboard-card__header">
            <div>
              <span className="panel__label">Triagem rápida</span>
              <h2>Candidatos ranqueados por compatibilidade</h2>
            </div>
            <Link className="secondary-button" to="/empresa/candidatos">Gerenciar</Link>
          </div>

          {isLoading ? (
            <p className="dashboard-empty">Carregando candidatos...</p>
          ) : topCandidates.length ? (
            <ol className="ranking-list">
              {topCandidates.map((candidate, index) => (
                <li key={candidate.id} className="ranking-item">
                  <span className="ranking-item__position">{index + 1}</span>
                  <span className="ranking-item__avatar">{getInitials(candidate.student.name)}</span>
                  <div className="ranking-item__info">
                    <strong>{candidate.student.name}</strong>
                    <span>{candidate.jobTitle}</span>
                  </div>
                  <span className={`status-pill status-pill--${getApplicationStatusTone(candidate.status)}`}>
                    {getApplicationStatusLabel(candidate.status)}
                  </span>
                  <span className={`ranking-item__score ranking-item__score--${getScoreTone(candidate.score)}`}>
                    {candidate.score}%
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="dashboard-empty">Ainda não há candidaturas. Publique vagas para começar a receber talentos.</p>
          )}
        </article>

        <article className="panel dashboard-card dashboard-card--jobs">
          <div className="dashboard-card__header">
            <div>
              <span className="panel__label">Minhas vagas</span>
              <h2>Gerencie suas publicações</h2>
            </div>
            <button className="secondary-button" type="button" onClick={openNewJobForm}>+ Nova vaga</button>
          </div>

          {isLoading ? (
            <p className="dashboard-empty">Carregando vagas...</p>
          ) : jobs.length ? (
            <div className="dashboard-jobs-list">
              {jobs.map((job) => (
                <article key={job.id} className={selectedJobId === job.id ? "dashboard-job-row dashboard-job-row--active" : "dashboard-job-row"}>
                  <div className="dashboard-job-row__info">
                    <strong>{job.title}</strong>
                    <span>{job.course ?? "Sem curso obrigatório"} • {job.availability ? getAvailabilityLabel(job.availability) : "Horário a combinar"}</span>
                  </div>
                  <span className={job.isActive ? "status-pill status-pill--green" : "status-pill status-pill--amber"}>
                    {job.isActive ? "Ativa" : "Pausada"}
                  </span>
                  <div className="dashboard-job-row__actions">
                    <button className="ghost-button" type="button" onClick={() => openEditJobForm(job)}>Editar</button>
                    <button className="ghost-button" type="button" onClick={() => void handleToggleJobStatus(job)}>
                      {job.isActive ? "Pausar" : "Reativar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">Você ainda não publicou vagas. Clique em "Abrir nova vaga" para começar.</p>
          )}
        </article>
      </section>

      {showForm ? (
        <section className="panel dashboard-card dashboard-job-form-card">
          <div className="dashboard-card__header">
            <div>
              <span className="panel__label">{selectedJobId ? "Editar vaga" : "Nova vaga"}</span>
              <h2>{selectedJobId ? "Atualize os dados da oportunidade" : "Preencha os dados da nova oportunidade"}</h2>
            </div>
            <button className="ghost-button" type="button" onClick={() => setShowForm(false)}>Fechar ✕</button>
          </div>

          {successMessage ? <p className="form-success">{successMessage}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}

          <form className="auth-form company-jobs-form" onSubmit={handleSubmit}>
            <div className="profile-form__grid">
              <label className="field">
                <span>Título da vaga</span>
                <input value={title} onChange={(event) => setTitle(event.target.value)} required />
              </label>

              <label className="field jobs-filter-select">
                <span>Modelo</span>
                <select value={model} onChange={(event) => setModel(event.target.value as JobModel)}>
                  <option value="REMOTE">Remoto</option>
                  <option value="HYBRID">Híbrido</option>
                  <option value="IN_PERSON">Presencial</option>
                </select>
              </label>

              <label className="field">
                <span>Curso recomendado</span>
                <input value={course} onChange={(event) => setCourse(event.target.value)} placeholder="Engenharia de Software" />
              </label>

              <label className="field jobs-filter-select">
                <span>Disponibilidade principal</span>
                <select value={availability} onChange={(event) => setAvailability(event.target.value as AvailabilityOption | "")}>
                  <option value="">A combinar</option>
                  {availabilityOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field profile-form__field--full">
              <span>Local</span>
              <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Manaus, AM" />
            </label>

            <label className="field profile-form__field--full">
              <span>Habilidades</span>
              <input value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="React, TypeScript, SQL" required />
            </label>

            <label className="field profile-form__field--full">
              <span>Descrição</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={6} required />
            </label>

            <div className="profile-form__actions">
              <button className="primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : selectedJobId ? "Salvar alterações" : "Publicar vaga"}
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </section>
  );
}
