import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { formatAvailabilityList, getStudents, type StudentProfile } from "../services/students";

export function StudentsPage() {
  const { token, user } = useAuth();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || (user?.role !== "COMPANY" && user?.role !== "COORDINATOR")) {
      setStudents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    getStudents(token)
      .then((response) => {
        setStudents(response);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os candidatos.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token, user]);

  const summary = useMemo(
    () => [
      {
        label: "Perfis ativos",
        value: String(students.length),
        helper: "Estudantes carregados do backend",
      },
      {
        label: "Cursos mapeados",
        value: String(new Set(students.map((student) => student.course)).size),
        helper: "Diversidade de formações cadastradas",
      },
      {
        label: "Portfólios informados",
        value: String(students.filter((student) => student.portfolio).length),
        helper: "Perfis com material complementar",
      },
    ],
    [students]
  );

  return (
    <section className="page-section students-page students-page--refined">
      <header className="page-header students-page__header">
        <div>
          <span className="page-eyebrow">Candidatos</span>
          <h1>Visibilidade para estudantes que procuram estágio.</h1>
          <p>
            Esta área mostra os perfis cadastrados no backend para facilitar a conexão com recrutadores e empresas.
          </p>
        </div>
      </header>

      <section className="content-grid content-grid--three students-page__summary">
        {summary.map((item) => (
          <article key={item.label} className="panel student-summary-card student-summary-card--directory">
            <span className="panel__label">{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.helper}</p>
          </article>
        ))}
      </section>

      {isLoading ? (
        <div className="content-grid content-grid--three">
          {[1, 2, 3].map((item) => (
            <div key={item} className="panel skeleton-card" />
          ))}
        </div>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : !students.length ? (
        <section className="panel students-page__hero-card">
          <span className="panel__label">Base de talentos</span>
          <h2>Nenhum candidato disponível no momento.</h2>
          <p>Assim que houver perfis cadastrados e visíveis, eles aparecerão aqui.</p>
        </section>
      ) : (
        <section className="content-grid content-grid--three students-page__directory-preview">
          {students.map((student) => (
            <article key={student.id} className="panel students-page__directory-card">
              <span className="panel__label">{student.course}</span>
              <strong>{student.name}</strong>
              <p>{formatAvailabilityList(student.availability)}</p>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
