import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import {
  downloadApplicationsCSV,
  getApplicationsByJob,
  type ApplicationStatus,
  type CompanyApplication,
} from "../services/applications";
import { getJobs, type JobItem } from "../services/jobs";

type JobApplications = { job: JobItem; applications: CompanyApplication[] };
type DashboardApplication = CompanyApplication & { jobId: string; jobTitle: string };

const statusChart: Array<{ key: ApplicationStatus; label: string; tone: string }> = [
  { key: "SENT", label: "Enviado", tone: "blue" },
  { key: "UNDER_REVIEW", label: "Em análise", tone: "amber" },
  { key: "INTERVIEW", label: "Entrevista", tone: "violet" },
  { key: "APPROVED", label: "Aprovado", tone: "emerald" },
  { key: "REJECTED", label: "Reprovado", tone: "rose" },
];

export function CoordinatorDashboardPage() {
  const { token, user } = useAuth();
  const [data, setData] = useState<JobApplications[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | ApplicationStatus>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<"all" | "30" | "90" | "365">("all");

  useEffect(() => {
    if (!token || user?.role !== "COORDINATOR") {
      setData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    getJobs(token)
      .then(async (jobs) => {
        const results = await Promise.allSettled(jobs.map((job) => getApplicationsByJob(job.id, token)));
        const merged: JobApplications[] = jobs.map((job, index) => ({
          job,
          applications: results[index].status === "fulfilled" ? (results[index] as PromiseFulfilledResult<CompanyApplication[]>).value : [],
        }));
        setData(merged);
      })
      .catch(() => setData([]))
      .finally(() => setIsLoading(false));
  }, [token, user]);

  const allApplications = useMemo<DashboardApplication[]>(
    () => data.flatMap(({ job, applications }) => applications.map((application) => ({
      ...application,
      jobId: job.id,
      jobTitle: job.title,
    }))),
    [data],
  );

  const filteredApplications = useMemo(() => {
    const cutoff = selectedPeriod === "all"
      ? null
      : new Date(Date.now() - Number(selectedPeriod) * 24 * 60 * 60 * 1000);

    return allApplications.filter((application) => {
      const matchesJob = selectedJobId === "all" || application.jobId === selectedJobId;
      const matchesStatus = selectedStatus === "all" || application.status === selectedStatus;
      const createdAt = new Date(application.createdAt);
      const matchesPeriod = !cutoff || (!Number.isNaN(createdAt.getTime()) && createdAt >= cutoff);
      return matchesJob && matchesStatus && matchesPeriod;
    });
  }, [allApplications, selectedJobId, selectedPeriod, selectedStatus]);

  const statusCounts = useMemo(() => {
    const counts: Record<ApplicationStatus, number> = {
      SENT: 0,
      UNDER_REVIEW: 0,
      INTERVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
    };
    filteredApplications.forEach((application) => {
      counts[application.status] += 1;
    });
    return counts;
  }, [filteredApplications]);

  const maxStatusCount = Math.max(1, ...Object.values(statusCounts));

  const evolutionData = useMemo(() => {
    const grouped = new Map<string, { label: string; count: number; sortValue: number }>();

    filteredApplications.forEach((application) => {
      const date = new Date(application.createdAt);
      if (Number.isNaN(date.getTime())) return;

      const sortValue = date.getFullYear() * 100 + date.getMonth();
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const current = grouped.get(key);

      grouped.set(key, {
        label: date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", ""),
        count: (current?.count ?? 0) + 1,
        sortValue,
      });
    });

    return Array.from(grouped.values()).sort((first, second) => first.sortValue - second.sortValue).slice(-8);
  }, [filteredApplications]);

  const maxEvolutionCount = Math.max(1, ...evolutionData.map((item) => item.count));

  const macroStats = useMemo(() => {
    const filteredJobIds = new Set(filteredApplications.map((application) => application.jobId));
    const companies = new Set(data.filter((item) => filteredJobIds.has(item.job.id)).map((item) => item.job.company?.id).filter(Boolean));
    const approved = statusCounts.APPROVED;
    const approvalRate = filteredApplications.length ? Math.round((approved / filteredApplications.length) * 100) : 0;

    return [
      { label: "Vagas no recorte", value: String(filteredJobIds.size), tone: "blue" as const, icon: "💼" },
      { label: "Candidaturas no recorte", value: String(filteredApplications.length), tone: "violet" as const, icon: "📨" },
      { label: "Empresas ativas", value: String(companies.size), tone: "emerald" as const, icon: "🏢" },
      { label: "Taxa de aprovação", value: `${approvalRate}%`, tone: "amber" as const, icon: "📈" },
    ];
  }, [data, filteredApplications, statusCounts]);

  // Vagas travadas em triagem: têm candidaturas, mas nenhuma avançou para entrevista/aprovação.
  const stuckJobs = useMemo(() => {
    return data
      .map((item) => {
        const pending = item.applications.filter((app) => app.status === "SENT" || app.status === "UNDER_REVIEW").length;
        const advanced = item.applications.filter((app) => app.status === "INTERVIEW" || app.status === "APPROVED").length;
        return { job: item.job, pending, advanced, total: item.applications.length };
      })
      .filter((item) => item.total > 0 && item.advanced === 0 && item.pending > 0)
      .sort((first, second) => second.pending - first.pending);
  }, [data]);

  async function handleExport() {
    if (!token) return;
    setIsExporting(true);
    setExportError(null);
    try {
      await downloadApplicationsCSV(token);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Falha ao exportar.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <section className="page-section dashboard-page">
      <header className="dashboard-hero dashboard-hero--coordinator">
        <div className="dashboard-hero__copy">
          <span className="dashboard-hero__eyebrow">Painel da Coordenação</span>
          <h1>Visão macro do sistema</h1>
          <p>Acompanhe o status geral das candidaturas, identifique vagas travadas e exporte os dados.</p>
        </div>
        <div className="dashboard-hero__actions">
          <button className="dashboard-hero__button" type="button" onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Exportando..." : "⬇ Exportar CSV"}
          </button>
        </div>
      </header>

      {exportError ? <p className="form-error">{exportError}</p> : null}

      <section className="panel dashboard-filters" aria-label="Filtros do dashboard">
        <div className="dashboard-filters__intro">
          <span className="panel__label">Filtros</span>
          <strong>Escolha o recorte da análise</strong>
        </div>
        <label className="dashboard-filter">
          <span>Período</span>
          <select value={selectedPeriod} onChange={(event) => setSelectedPeriod(event.target.value as typeof selectedPeriod)}>
            <option value="all">Todo o período</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
          </select>
        </label>
        <label className="dashboard-filter">
          <span>Vaga</span>
          <select value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)}>
            <option value="all">Todas as vagas</option>
            {data.map(({ job }) => <option key={job.id} value={job.id}>{job.title}</option>)}
          </select>
        </label>
        <label className="dashboard-filter">
          <span>Status</span>
          <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as typeof selectedStatus)}>
            <option value="all">Todos os status</option>
            {statusChart.map((status) => <option key={status.key} value={status.key}>{status.label}</option>)}
          </select>
        </label>
      </section>

      <section className="dashboard-stats">
        {macroStats.map((item) => (
          <article key={item.label} className={`dashboard-stat dashboard-stat--${item.tone}`}>
            <span className="dashboard-stat__icon" aria-hidden="true">{item.icon}</span>
            <div className="dashboard-stat__body">
              <span className="dashboard-stat__label">{item.label}</span>
              <strong className="dashboard-stat__value">{item.value}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-grid dashboard-grid--coordinator">
        <article className="panel dashboard-card dashboard-card--chart">
          <div className="dashboard-card__header">
            <div>
              <span className="panel__label">Distribuição de candidaturas</span>
              <h2>Status geral no sistema</h2>
            </div>
          </div>

          {isLoading ? (
            <p className="dashboard-empty">Carregando dados...</p>
          ) : filteredApplications.length ? (
            <div className="chart-bars">
              {statusChart.map((status) => {
                const count = statusCounts[status.key];
                const width = Math.round((count / maxStatusCount) * 100);
                return (
                  <div key={status.key} className="chart-bar">
                    <span className="chart-bar__label">{status.label}</span>
                    <div className="chart-bar__track">
                      <div className={`chart-bar__fill chart-bar__fill--${status.tone}`} style={{ width: `${width}%` }} />
                    </div>
                    <span className="chart-bar__value">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="dashboard-empty">Nenhuma candidatura encontrada com esses filtros.</p>
          )}
        </article>

        <article className="panel dashboard-card dashboard-card--alerts">
          <div className="dashboard-card__header">
            <div>
              <span className="panel__label">Alertas</span>
              <h2>Vagas travadas em triagem</h2>
            </div>
            <span className="dashboard-alert-count">{stuckJobs.length}</span>
          </div>

          {isLoading ? (
            <p className="dashboard-empty">Carregando alertas...</p>
          ) : stuckJobs.length ? (
            <ul className="alert-list">
              {stuckJobs.slice(0, 6).map((item) => (
                <li key={item.job.id} className="alert-item">
                  <span className="alert-item__icon" aria-hidden="true">⚠️</span>
                  <div className="alert-item__info">
                    <strong>{item.job.title}</strong>
                    <span>{item.job.company?.name ?? "Empresa"}</span>
                  </div>
                  <span className="alert-item__badge">{item.pending} parada(s)</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dashboard-empty">Nenhuma vaga travada. Tudo fluindo! 🎉</p>
          )}
        </article>
      </section>

      <section className="panel dashboard-card dashboard-card--evolution">
        <div className="dashboard-card__header">
          <div>
            <span className="panel__label">Evolução das candidaturas</span>
            <h2>Quantas candidaturas chegaram em cada período?</h2>
          </div>
          <span className="dashboard-card__helper">Últimos 8 períodos com movimentação</span>
        </div>

        {isLoading ? (
          <p className="dashboard-empty">Carregando evolução...</p>
        ) : evolutionData.length ? (
          <div className="evolution-chart" aria-label="Candidaturas recebidas por período">
            {evolutionData.map((item) => (
              <div key={`${item.label}-${item.sortValue}`} className="evolution-chart__column">
                <span className="evolution-chart__value">{item.count}</span>
                <div className="evolution-chart__track">
                  <div
                    className="evolution-chart__bar"
                    style={{ height: `${Math.max(10, Math.round((item.count / maxEvolutionCount) * 100))}%` }}
                  />
                </div>
                <span className="evolution-chart__label">{item.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="dashboard-empty">Ainda não há candidaturas para mostrar a evolução.</p>
        )}
      </section>
    </section>
  );
}
