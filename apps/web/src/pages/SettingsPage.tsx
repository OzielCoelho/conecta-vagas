const settingsItems = [
  { label: "Tema visual", value: "Claro por enquanto" },
  { label: "Integração com API", value: "Preparada por variável de ambiente" },
  { label: "Próximo passo", value: "Conectar autenticação e dados reais" },
];

export function SettingsPage() {
  return (
    <section className="page-section">
      <header className="page-header">
        <div>
          <span className="page-eyebrow">Configurações</span>
          <h1>Uma base pronta para evoluir o aplicativo.</h1>
          <p>
            Aqui podemos depois adicionar preferências, conta do usuário, permissões e ajustes de integração.
          </p>
        </div>
      </header>

      <div className="content-grid">
        {settingsItems.map((item) => (
          <article key={item.label} className="panel">
            <span className="panel__label">{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
