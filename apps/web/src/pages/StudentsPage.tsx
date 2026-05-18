const studentHighlights = [
  "Perfis organizados por curso, habilidades e disponibilidade.",
  "Base ideal para empresas encontrarem estagiários com mais facilidade.",
  "Pode evoluir para ranking, busca e filtros sem mudar o layout principal.",
];

export function StudentsPage() {
  return (
    <section className="page-section">
      <header className="page-header">
        <div>
          <span className="page-eyebrow">Alunos</span>
          <h1>Visibilidade para estudantes que procuram estágio.</h1>
          <p>
            Esta área foi pensada para destacar perfis estudantis e facilitar a conexão com recrutadores e empresas.
          </p>
        </div>
      </header>

      <div className="panel">
        <ul className="feature-list">
          {studentHighlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
