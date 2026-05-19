import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { getStoredDemoJobs } from "../demo/demo-storage";
import { getMyApplications, type StudentApplication } from "../services/applications";
import { getJobs, getJobModelLabel, type JobItem } from "../services/jobs";
import { getStudents, type StudentProfile } from "../services/students";
import networkingHeroImage from "../imagens/HD-wallpaper-social-networks-blue-digital-background-networking-concepts-blue-networking-background-technology-background.jpg";

const feedImages = [networkingHeroImage, networkingHeroImage, networkingHeroImage];

function formatPublishedAt(date?: string) {
  if (!date) return "Agora mesmo";

  const parsed = new Date(date);
  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function FeedPage() {
  const { token, user } = useAuth();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setJobs(getStoredDemoJobs() as JobItem[]);
      setStudents([]);
      setApplications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (user?.role === "COMPANY") {
      Promise.allSettled([getStudents(token)])
        .then(([studentsResult]) => {
          setStudents(studentsResult.status === "fulfilled" ? studentsResult.value : []);
          setJobs([]);
          setApplications([]);
        })
        .finally(() => setIsLoading(false));
      return;
    }

    Promise.allSettled([
      getJobs(token),
      user?.role === "STUDENT" ? getMyApplications(token) : Promise.resolve([] as StudentApplication[]),
    ])
      .then(([jobsResult, applicationsResult]) => {
        const realJobs = jobsResult.status === "fulfilled" ? jobsResult.value : [];
        const fallbackJobs = getStoredDemoJobs() as JobItem[];
        setJobs(
          realJobs.length >= 3
            ? realJobs
            : [
                ...realJobs,
                ...fallbackJobs.filter(
                  (demoJob: JobItem) => !realJobs.some((job) => job.id === demoJob.id)
                ),
              ].slice(0, 6)
        );
        setApplications(applicationsResult.status === "fulfilled" ? applicationsResult.value : []);
        setStudents([]);
      })
      .finally(() => setIsLoading(false));
  }, [token, user]);

  const studentFeed = useMemo(
    () =>
      jobs.map((job, index) => ({
        ...job,
        image: feedImages[index % feedImages.length],
        applied: applications.some((application) => application.job.id === job.id),
      })),
    [applications, jobs]
  );

  const companyFeed = useMemo(() => students.slice(0, 8), [students]);

  if (isLoading) {
    return (
      <section className="page-section feed-page">
        <header className="page-header feed-page__header">
          <div>
            <span className="page-eyebrow">Feed</span>
            <h1>Carregando publicações recentes...</h1>
          </div>
        </header>
      </section>
    );
  }

  const isCompany = user?.role === "COMPANY";

  return (
    <section className="page-section feed-page feed-page--refined">
      <header className="page-header feed-page__header">
        <div>
          <span className="page-eyebrow">Feed</span>
          <h1>{isCompany ? "Veja candidatos em destaque no seu radar." : "Acompanhe as publicações mais recentes de vagas."}</h1>
          <p>{isCompany ? "Um feed mais limpo para descobrir perfis, habilidades e disponibilidade rapidamente." : "Um feed visual, direto e organizado para explorar vagas recentes com contexto rápido."}</p>
        </div>
      </header>

      {!isCompany ? (
        <section className="feed-grid">
          {studentFeed.map((item) => (
            <article key={item.id} className="panel feed-card">
              <div className="feed-card__media">
                <img src={item.image} alt={item.company?.name ?? "Empresa parceira"} />
              </div>
              <div className="feed-card__content">
                <div className="feed-card__top">
                  <div className="feed-card__identity">
                    <span className="feed-card__avatar">{getInitials(item.company?.name ?? "Empresa parceira")}</span>
                    <div>
                      <strong>{item.company?.name ?? "Empresa parceira"}</strong>
                      <span>{formatPublishedAt(item.createdAt)}</span>
                    </div>
                  </div>
                  <span className="status-pill status-pill--highlight">{getJobModelLabel(item.model)}</span>
                </div>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
                <div className="feed-card__chips">
                  <span className="skill-tag">{item.course ?? "Curso flexível"}</span>
                  <span className="skill-tag">{item.availability ?? "Horário a combinar"}</span>
                  <span className="skill-tag">{item.location ?? "Local flexível"}</span>
                </div>
                <div className="feed-card__footer">
                  <span>{item.applied ? "Você já se candidatou" : "Nova oportunidade para seu perfil"}</span>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="feed-grid">
          {companyFeed.length ? (
            companyFeed.map((student) => (
              <article key={student.id} className="panel feed-card feed-card--candidate">
                <div className="feed-card__content">
                  <div className="feed-card__top">
                    <div className="feed-card__identity">
                      {student.photoUrl ? (
                        <img className="feed-card__avatar feed-card__avatar--image" src={student.photoUrl} alt={student.name} />
                      ) : (
                        <span className="feed-card__avatar">{getInitials(student.name)}</span>
                      )}
                      <div>
                        <strong>{student.name}</strong>
                        <span>{student.course}</span>
                      </div>
                    </div>
                    <span className="status-pill status-pill--highlight">{student.availability}</span>
                  </div>
                  <p>{student.portfolio ?? "Perfil disponível para conexão com empresas e oportunidades abertas."}</p>
                  <div className="feed-card__chips">
                    {student.skills.slice(0, 4).map((skill) => (
                      <span key={skill} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <article className="panel jobs-empty-state">
              <span className="panel__label">Sem perfis por enquanto</span>
              <h2>Assim que novos candidatos ficarem visíveis, eles aparecem aqui.</h2>
              <p>Esse feed é pensado para a empresa acompanhar rapidamente quem está disponível.</p>
            </article>
          )}
        </section>
      )}
    </section>
  );
}
