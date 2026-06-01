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

  const allApplications = useMemo(() => data.flatMap((item) => item.applications), [data]);

  const statusCounts = useMemo(() => {
    const counts: Record<ApplicationStatus, number> = {
      SENT: 0,
      UNDER_REVIEW: 0,
      INTERVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
    };
    allApplications.forEach((application) => {
      counts[application.status] += 1;
    });
    return counts;
  }, [allApplications]);

  const maxStatusCount = Math.max(1, ...Object.values(statusCounts));

  const macroStats = useMemo(() => {
    const companies = new Set(data.map((item) => item.job.company?.id).filter(Boolean));
    const approved = statusCounts.APPROVED;
    const approvalRate = allApplications.length ? Math.round((approved / allApplications.length) * 100) : 0;

    return [
      { label: "Vagas no sistema", value: String(data.length), tone: "blue" as const, icon: "💼" },
      { label: "Candidaturas totais", value: String(allApplications.length), tone: "violet" as const, icon: "📨" },
      { label: "Empresas ativas", value: String(companies.size), tone: "emerald" as const, icon: "🏢" },
      { label: "Taxa de aprovação", value: `${approvalRate}%`, tone: "amber" as const, icon: "📈" },
    ];
  }, [data, allApplications, statusCounts]);

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
          ) : allApplications.length ? (
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
            <p className="dashboard-empty">Sem candidaturas registradas ainda.</p>
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
    </section>
  );
}
