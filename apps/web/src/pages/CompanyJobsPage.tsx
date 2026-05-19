import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthProvider";
import {
  createJob,
  getJobModelLabel,
  getMyCompanyJobs,
  updateJob,
  type CreateJobInput,
  type JobItem,
  type JobModel,
} from "../services/jobs";

const initialForm: CreateJobInput = {
  title: "",
  description: "",
  skills: [],
  model: "REMOTE",
  location: "",
  course: "",
  availability: "",
};

export function CompanyJobsPage() {
  const { token, user } = useAuth();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [model, setModel] = useState<JobModel>("REMOTE");
  const [location, setLocation] = useState("");
  const [course, setCourse] = useState("");
  const [availability, setAvailability] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token || user?.role !== "COMPANY") {
      setJobs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    getMyCompanyJobs(token)
      .then((response) => {
        setJobs(response);
        setSelectedJobId(response[0]?.id ?? "");
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar suas vagas.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token, user]);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? null,
    [jobs, selectedJobId]
  );

  useEffect(() => {
    if (!selectedJob) {
      setTitle("");
      setDescription("");
      setSkills("");
      setModel("REMOTE");
      setLocation("");
      setCourse("");
      setAvailability("");
      return;
    }

    setTitle(selectedJob.title);
    setDescription(selectedJob.description);
    setSkills(selectedJob.skills.join(", "));
    setModel(selectedJob.model);
    setLocation(selectedJob.location ?? "");
    setCourse(selectedJob.course ?? "");
    setAvailability(selectedJob.availability ?? "");
  }, [selectedJob]);

  const summary = useMemo(
    () => [
      {
        label: "Vagas publicadas",
        value: String(jobs.length),
        helper: "Oportunidades criadas pela sua empresa",
      },
      {
        label: "Vagas ativas",
        value: String(jobs.filter((job) => job.isActive).length),
        helper: "Disponíveis para candidatura",
      },
      {
        label: "Modelos usados",
        value: String(new Set(jobs.map((job) => job.model)).size),
        helper: "Remoto, híbrido ou presencial",
      },
    ],
    [jobs]
  );

  function resetForm() {
    setSelectedJobId("");
    setTitle("");
    setDescription("");
    setSkills("");
    setModel("REMOTE");
    setLocation("");
    setCourse("");
    setAvailability("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError("Sessão inválida. Faça login novamente.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

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
      if (selectedJobId) {
        const updated = await updateJob(selectedJobId, payload, token);
        setJobs((current) => current.map((job) => (job.id === updated.id ? updated : job)));
        setSuccessMessage("Vaga atualizada com sucesso.");
      } else {
        const created = await createJob(payload, token);
        setJobs((current) => [created, ...current]);
        setSelectedJobId(created.id);
        setSuccessMessage("Vaga criada com sucesso.");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível salvar a vaga.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleJobStatus(job: JobItem) {
    if (!token) return;

    setError(null);
    setSuccessMessage(null);

    try {
      const updated = await updateJob(
        job.id,
        {
          title: job.title,
          description: job.description,
          skills: job.skills,
          model: job.model,
          location: job.location ?? undefined,
          course: job.course ?? undefined,
          availability: job.availability ?? undefined,
          isActive: !job.isActive,
        },
        token
      );
      setJobs((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      if (selectedJobId === updated.id) {
        setSelectedJobId(updated.id);
      }
      setSuccessMessage(updated.isActive ? "Vaga reativada com sucesso." : "Vaga pausada com sucesso.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível atualizar o status da vaga.");
    }
  }

  if (isLoading) {
    return (
      <section className="page-section company-jobs-page">
        <header className="page-header company-jobs-page__header">
          <div>
            <span className="page-eyebrow">Gestão de vagas</span>
            <h1>Carregando vagas da empresa...</h1>
          </div>
        </header>
      </section>
    );
  }

  return (
    <section className="page-section company-jobs-page company-jobs-page--refined">
      <header className="page-header company-jobs-page__header">
        <div>
          <span className="page-eyebrow">Gestão de vagas</span>
          <h1>Crie e edite vagas para atrair os candidatos certos.</h1>
          <p>Publique novas oportunidades, ajuste requisitos e ative ou pause vagas em um único painel.</p>
        </div>
      </header>

      <section className="content-grid content-grid--three company-jobs-page__summary">
        {summary.map((item) => (
          <article key={item.label} className="panel company-summary-card">
            <span className="panel__label">{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.helper}</p>
          </article>
        ))}
      </section>

      <section className="company-jobs-layout">
        <article className="panel company-jobs-list-card">
          <div className="company-jobs-list-card__header">
            <div>
              <span className="panel__label">Minhas vagas</span>
              <h2>Oportunidades publicadas</h2>
            </div>
            <button className="secondary-button" type="button" onClick={resetForm}>
              Nova vaga
            </button>
          </div>

          {jobs.length ? (
            <div className="company-jobs-list">
              {jobs.map((job) => (
                <article
                  key={job.id}
                  className={selectedJobId === job.id ? "company-job-card company-job-card--active" : "company-job-card"}
                >
                  <div>
                    <span className="panel__label">{getJobModelLabel(job.model)}</span>
                    <strong>{job.title}</strong>
                    <p>{job.course ?? "Sem curso obrigatório"}</p>
                  </div>
                  <div className="company-job-card__actions">
                    <span className={job.isActive ? "status-pill status-pill--green" : "status-pill status-pill--red"}>
                      {job.isActive ? "Ativa" : "Pausada"}
                    </span>
                    <button className="secondary-button" type="button" onClick={() => setSelectedJobId(job.id)}>
                      Editar
                    </button>
                    <button className="secondary-button" type="button" onClick={() => void handleToggleJobStatus(job)}>
                      {job.isActive ? "Pausar" : "Reativar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p>Você ainda não publicou vagas. Crie a primeira para começar a receber candidaturas.</p>
          )}
        </article>

        <article className="panel company-jobs-form-card">
          <div className="company-jobs-form-card__header">
            <div>
              <span className="panel__label">{selectedJobId ? "Editar vaga" : "Nova vaga"}</span>
              <h2>{selectedJobId ? "Atualize os dados da oportunidade" : "Preencha os dados da nova oportunidade"}</h2>
            </div>
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

              <label className="field">
                <span>Disponibilidade</span>
                <input value={availability} onChange={(event) => setAvailability(event.target.value)} placeholder="Manhã e tarde" />
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
        </article>
      </section>
    </section>
  );
}
