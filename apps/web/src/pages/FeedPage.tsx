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
import { getAvailabilityLabel, getJobs, getJobModelLabel, type JobItem } from "../services/jobs";
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
import mulherImage from "../imagens/mulher.png";
import chrisImage from "../imagens/chris.webp";
import soichiroImage from "../imagens/soichiro_01.jpg";
import karinaImage from "../imagens/aespa-karina-prada-ambassador-280824.jpg";

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

const companyFeedFallbackPhotos = [mulherImage, chrisImage, soichiroImage, karinaImage];
const fakeCompanyFeedNames = new Set([
  "gabriel takashi",
  "gabriel soares",
  "ana clara souza",
  "mariana oliveira",
]);

function isFakeCompanyFeedProfile(student: StudentProfile) {
  const normalizedName = student.name.trim().toLowerCase();
  const normalizedId = student.id.trim().toLowerCase();
  const normalizedPortfolio = student.portfolio?.trim().toLowerCase() ?? "";

  return (
    normalizedId.startsWith("demo-") ||
    normalizedName.includes("demo") ||
    normalizedPortfolio.includes("portfolio-demo.dev") ||
    fakeCompanyFeedNames.has(normalizedName)
  );
}

function getCandidatePhoto(student: StudentProfile) {
  if (student.photoUrl) {
    return student.photoUrl;
  }

  const total = student.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return companyFeedFallbackPhotos[total % companyFeedFallbackPhotos.length];
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
    location: job.location?.trim() || (job.model === "REMOTE" ? "Trabalho remoto" : undefined),
    availabilityLabel: getAvailabilityLabel(job.availability),
    courseLabel: job.course?.trim() || undefined,
    skills: job.skills.slice(0, 6),
    applicationStatus: application?.status,
  };
}

function buildCompanyPost(student: StudentProfile) {
  const candidatePhoto = getCandidatePhoto(student);

  return {
    id: student.id,
    name: student.name,
    course: student.course,
    publishedAtLabel: student.city || student.state ? [student.city, student.state].filter(Boolean).join(", ") : "Perfil disponível agora",
    avatarText: getInitials(student.name),
    avatarImage: candidatePhoto ?? undefined,
    heroImage: candidatePhoto || selectFeedImage(student.id),
    availabilityLabel: formatAvailabilityList(student.availability),
    highlightText: student.headline ?? student.summary ?? student.portfolio ?? "Perfil aberto para novas conexões com empresas e oportunidades.",
    metaLine: [student.university, student.semester].filter(Boolean).join(" • ") || undefined,
    location: [student.city, student.state].filter(Boolean).join(", ") || undefined,
    skills: student.skills.slice(0, 6),
  };
}

const skillChipTones = ["blue", "violet", "emerald", "amber", "rose", "cyan"] as const;

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

  const companyFeed = useMemo(
    () => students.filter((student) => !isFakeCompanyFeedProfile(student)).slice(0, 8).map(buildCompanyPost),
    [students]
  );

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
      <header className="feed-candidates-header">
        {isCompany ? (
          <>
            <span className="page-eyebrow">Candidatos disponíveis</span>
            <h1>Talentos prontos para novas oportunidades</h1>
            <p>Veja rapidamente quem está disponível, com skills e disponibilidade em destaque.</p>
          </>
        ) : (
          <>
            <span className="page-eyebrow">Vagas para você</span>
            <h1>Oportunidades alinhadas ao seu perfil</h1>
            <p>Explore as vagas em destaque, com skills e disponibilidade para combinar com você.</p>
          </>
        )}
      </header>

      {!isCompany ? (
        <section className="feed-candidates-grid">
          {studentFeed.length ? (
            studentFeed.map((item) => {
              const statusTone = item.applicationStatus ? getApplicationStatusTone(item.applicationStatus) : "highlight";
              const statusLabel = item.applicationStatus ? getApplicationStatusLabel(item.applicationStatus) : "Nova oportunidade";

              return (
                <article key={item.id} className="panel feed-candidate-card">
                  <div className="feed-candidate-card__media">
                    <img src={item.heroImage} alt={item.companyName} />
                    <span className="feed-candidate-card__avail">{item.modelLabel}</span>
                  </div>

                  <div className="feed-candidate-card__body">
                    <div className="feed-candidate-card__identity">
                      <span className="feed-candidate-card__avatar feed-card__avatar--gradient">{item.avatarText}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.companyName}</span>
                      </div>
                    </div>

                    <p className="feed-candidate-card__highlight">{item.description}</p>

                    {item.skills.length ? (
                      <div className="feed-candidate-card__tags">
                        {item.skills.slice(0, 4).map((skill, index) => (
                          <span key={skill} className={`feed-chip feed-chip--${skillChipTones[index % skillChipTones.length]}`}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="feed-candidate-card__footer">
                      <span className={`status-pill status-pill--${statusTone}`}>{statusLabel}</span>
                      {item.location ? <span className="feed-candidate-card__meta">📍 {item.location}</span> : null}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <article className="panel jobs-empty-state feed-candidates-grid__empty">
              <span className="panel__label">Nenhuma vaga por enquanto</span>
              <h2>Assim que novas vagas forem publicadas, elas aparecem aqui.</h2>
            </article>
          )}
        </section>
      ) : (
        <section className="feed-candidates-grid">
          {companyFeed.length ? (
            companyFeed.map((item) => (
              <article key={item.id} className="panel feed-candidate-card">
                <div className="feed-candidate-card__media">
                  <img src={item.heroImage} alt={item.name} />
                  <span className="feed-candidate-card__avail">{item.availabilityLabel}</span>
                </div>

                <div className="feed-candidate-card__body">
                  <div className="feed-candidate-card__identity">
                    {item.avatarImage ? (
                      <img className="feed-candidate-card__avatar feed-candidate-card__avatar--image" src={item.avatarImage} alt={item.name} />
                    ) : (
                      <span className="feed-candidate-card__avatar feed-card__avatar--gradient">{item.avatarText}</span>
                    )}
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.course}</span>
                    </div>
                  </div>

                  <p className="feed-candidate-card__highlight">{item.highlightText}</p>

                  {item.skills.length ? (
                    <div className="feed-candidate-card__tags">
                      {item.skills.slice(0, 4).map((skill, index) => (
                        <span key={skill} className={`feed-chip feed-chip--${skillChipTones[index % skillChipTones.length]}`}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {item.metaLine ? <p className="feed-candidate-card__meta">🎓 {item.metaLine}</p> : null}
                </div>
              </article>
            ))
          ) : (
            <article className="panel jobs-empty-state feed-candidates-grid__empty">
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
