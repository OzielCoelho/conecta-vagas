import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { getStoredDemoJobs } from "../demo/demo-storage";
import {
  getApplicationStatusLabel,
  getApplicationStatusTone,
  getMyApplications,
  type ApplicationStatus,
  type StudentApplication,
} from "../services/applications";
import { getJobs, getJobModelLabel, type JobItem } from "../services/jobs";
import { formatAvailabilityList, getStudents, type StudentProfile } from "../services/students";
import networkingHeroImage from "../imagens/HD-wallpaper-social-networks-blue-digital-background-networking-concepts-blue-networking-background-technology-background.jpg";
import networkingImage from "../imagens/importancia-do-networking-1024x683.png";
import powerImage from "../imagens/The-power-of-networking-640x333.webp";
import basesImage from "../imagens/bases.jpg";
import socialImage from "../imagens/suporta-novas-empresas.webp";
import heroStageImage from "../imagens/estagios.png";
import javaImage from "../imagens/java.png";
import pythonImage from "../imagens/poython.jpg";
import cssImage from "../imagens/css.png";
import slideImage from "../imagens/slide_32.png";
import showcaseImage from "../imagens/Captura de tela 2026-05-18 205107.png";

const feedImages = [
  heroStageImage,
  slideImage,
  networkingHeroImage,
  basesImage,
  socialImage,
  powerImage,
  networkingImage,
  javaImage,
  pythonImage,
  cssImage,
  showcaseImage,
];

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

function selectFeedImage(seed: string) {
  const total = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return feedImages[total % feedImages.length];
}

function buildStudentPost(job: JobItem, application?: StudentApplication) {
  const companyName = job.company?.name ?? "Empresa parceira";

  return {
    id: job.id,
    companyName,
    publishedAtLabel: formatPublishedAt(job.createdAt),
    avatarText: getInitials(companyName),
    heroImage: selectFeedImage(job.id),
    title: job.title,
    description: job.description,
    modelLabel: getJobModelLabel(job.model),
    applicationStatus: application?.status,
  };
}

function buildCompanyPost(student: StudentProfile) {
  return {
    id: student.id,
    name: student.name,
    course: student.course,
    publishedAtLabel: student.city || student.state ? [student.city, student.state].filter(Boolean).join(", ") : "Perfil disponível agora",
    avatarText: getInitials(student.name),
    avatarImage: student.photoUrl ?? undefined,
    heroImage: student.photoUrl || selectFeedImage(student.id),
    availabilityLabel: formatAvailabilityList(student.availability),
    highlightText: student.headline ?? student.summary ?? student.portfolio ?? "Perfil aberto para novas conexões com empresas e oportunidades.",
    metaLine: [student.university, student.semester].filter(Boolean).join(" • ") || undefined,
  };
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

  const applicationsByJobId = useMemo(
    () => new Map(applications.map((application) => [application.job.id, application])),
    [applications]
  );

  const studentFeed = useMemo(
    () => jobs.map((job) => buildStudentPost(job, applicationsByJobId.get(job.id))),
    [applicationsByJobId, jobs]
  );

  const companyFeed = useMemo(() => students.slice(0, 8).map(buildCompanyPost), [students]);

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
    <section className="page-section feed-page feed-page--refined feed-page--social">
      <section className="panel feed-composer" aria-label="Criar publicação visual">
        <div className="feed-composer__top">
          <span className="feed-card__avatar">{getInitials(user?.name ?? (isCompany ? "Empresa" : "Aluno"))}</span>
          <button className="feed-composer__input" type="button">
            {isCompany ? "Compartilhe uma atualização da sua empresa" : "Compartilhe algo com seu feed"}
          </button>
        </div>
        <div className="feed-composer__actions" aria-hidden="true">
          <span className="feed-composer__action">Foto</span>
          <span className="feed-composer__action">Vídeo</span>
          <span className="feed-composer__action">Texto</span>
        </div>
      </section>

      {!isCompany ? (
        <section className="feed-grid feed-grid--social">
          {studentFeed.map((item) => {
            const statusTone = item.applicationStatus ? getApplicationStatusTone(item.applicationStatus) : "highlight";
            const statusLabel = item.applicationStatus ? getApplicationStatusLabel(item.applicationStatus) : "Nova oportunidade para seu perfil";

            return (
              <article key={item.id} className="panel feed-card feed-card--job">
                <div className="feed-card__content feed-card__content--padded">
                  <div className="feed-card__top">
                    <div className="feed-card__identity">
                      <span className="feed-card__avatar">{item.avatarText}</span>
                      <div>
                        <strong>{item.companyName}</strong>
                        <span>{item.publishedAtLabel}</span>
                      </div>
                    </div>
                    <span className="status-pill status-pill--highlight">{item.modelLabel}</span>
                  </div>
                </div>

                <div className="feed-card__media feed-card__media--social">
                  <img src={item.heroImage} alt={item.companyName} />
                  <span className="feed-card__overlay">Publicação de vaga</span>
                </div>

                <div className="feed-card__content feed-card__content--social">
                  <div className="feed-card__body">
                    <h2>{item.title}</h2>
                    <p className="feed-card__excerpt">{item.description}</p>
                  </div>

                  <div className="feed-card__footer feed-card__footer--social">
                    <span className={`status-pill status-pill--${statusTone}`}>{statusLabel}</span>
                    <span>{item.applicationStatus ? "Acompanhe sua candidatura no perfil" : "Veja se combina com sua disponibilidade"}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="feed-grid feed-grid--social">
          {companyFeed.length ? (
            companyFeed.map((item) => (
              <article key={item.id} className="panel feed-card feed-card--candidate feed-card--job">
                <div className="feed-card__content feed-card__content--padded">
                  <div className="feed-card__top">
                    <div className="feed-card__identity">
                      {item.avatarImage ? (
                        <img className="feed-card__avatar feed-card__avatar--image" src={item.avatarImage} alt={item.name} />
                      ) : (
                        <span className="feed-card__avatar">{item.avatarText}</span>
                      )}
                      <div>
                        <strong>{item.name}</strong>
                        <span>{item.course}</span>
                      </div>
                    </div>
                    <span className="status-pill status-pill--highlight">{item.availabilityLabel}</span>
                  </div>
                </div>

                <div className="feed-card__media feed-card__media--social">
                  <img src={item.heroImage} alt={item.name} />
                  <span className="feed-card__overlay">Candidato em destaque</span>
                </div>

                <div className="feed-card__content feed-card__content--social">
                  <div className="feed-card__body">
                    <h2>{item.name}</h2>
                    <p className="feed-card__excerpt">{item.highlightText}</p>
                  </div>

                  {item.metaLine ? <p className="feed-card__meta-line">{item.metaLine}</p> : null}

                  <div className="feed-card__footer feed-card__footer--social">
                    <span className="status-pill status-pill--highlight">Perfil disponível</span>
                    <span>{item.publishedAtLabel}</span>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <article className="panel jobs-empty-state">
              <span className="panel__label">Sem perfis por enquanto</span>
              <h2>Assim que novos candidatos ficarem visíveis, eles aparecem aqui.</h2>
              <p>Esse feed foi pensado para a empresa acompanhar rapidamente quem está disponível.</p>
            </article>
          )}
        </section>
      )}
    </section>
  );
}
