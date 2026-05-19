import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { CompanyProfileForm, type CompanyProfileFormValues } from "../components/profile/CompanyProfileForm";
import { getMyCompanyProfile, updateCompanyProfile } from "../services/companies";

export function CompanyProfilePage() {
  const { token } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<CompanyProfileFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    getMyCompanyProfile(token)
      .then((profile) => {
        setProfileId(profile.id);
        setInitialValues({
          name: profile.name,
          about: profile.about ?? "",
        });
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar o perfil.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  async function handleSubmit(data: Parameters<typeof updateCompanyProfile>[1]) {
    if (!token || !profileId) {
      setError("Perfil indisponível no momento.");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const updatedProfile = await updateCompanyProfile(profileId, data, token);
      setInitialValues({
        name: updatedProfile.name,
        about: updatedProfile.about ?? "",
      });
      setSuccessMessage("Perfil atualizado com sucesso.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível atualizar o perfil.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const content = useMemo(() => {
    if (isLoading) {
      return <div className="panel"><p>Carregando perfil...</p></div>;
    }

    if (!initialValues) {
      return <div className="panel"><p>{error ?? "Perfil não encontrado."}</p></div>;
    }

    return (
      <section className="company-profile-layout company-profile-layout--refined">
        <article className="panel company-profile-hero-card company-profile-hero-card--refined">
          <span className="panel__label">Empresa</span>
          <h2>{initialValues.name}</h2>
          <p>Atualize a apresentação da sua organização para dar mais contexto às vagas e ao processo seletivo.</p>
          <div className="company-profile-hero-card__chips">
            <span className="status-pill">Perfil institucional</span>
            <span className="status-pill status-pill--highlight">Pronto para recrutamento</span>
          </div>
          <div className="company-profile-highlight-list">
            <article className="company-profile-highlight-item">
              <span className="panel__label">Posicionamento</span>
              <strong>Marca empregadora clara</strong>
              <p>Ajuda o candidato a entender rapidamente quem é a empresa.</p>
            </article>
            <article className="company-profile-highlight-item">
              <span className="panel__label">Confiança</span>
              <strong>Perfil profissional</strong>
              <p>Mais contexto institucional melhora a percepção das vagas.</p>
            </article>
          </div>
        </article>

        <section className="content-grid content-grid--three company-profile-summary-grid">
          <article className="panel company-summary-card company-summary-card--profile">
            <span className="panel__label">Status</span>
            <strong>Ativo</strong>
            <p>Perfil institucional pronto para receber candidatos.</p>
          </article>
          <article className="panel company-summary-card company-summary-card--profile">
            <span className="panel__label">Vagas</span>
            <strong>08</strong>
            <p>Publicações que podem aproveitar esta apresentação.</p>
          </article>
          <article className="panel company-summary-card company-summary-card--profile">
            <span className="panel__label">Comunicação</span>
            <strong>Clara</strong>
            <p>Contexto objetivo para dar confiança ao candidato.</p>
          </article>
        </section>

        <section className="company-profile-detail-grid">
          <article className="panel company-profile-about-card">
            <span className="panel__label">Apresentação atual</span>
            <h2>Como sua empresa aparece para os candidatos</h2>
            <p>{initialValues.about || "Adicione uma descrição para apresentar sua cultura, área de atuação e objetivos das vagas."}</p>
          </article>

          <article className="panel company-profile-editor-card company-profile-editor-card--refined">
            <div>
              <span className="panel__label">Edição do perfil</span>
              <h2>Atualize apresentação e posicionamento da empresa</h2>
            </div>
            {successMessage ? <p className="form-success">{successMessage}</p> : null}
            <CompanyProfileForm
              initialValues={initialValues}
              submitLabel="Salvar alterações"
              isSubmitting={isSubmitting}
              error={error}
              onSubmit={handleSubmit}
            />
          </article>
        </section>
      </section>
    );
  }, [error, initialValues, isLoading, isSubmitting, successMessage]);

  return (
    <section className="page-section profile-page company-profile-page">
      <header className="page-header company-profile-page__header">
        <div>
          <span className="page-eyebrow">Meu perfil</span>
          <h1>Perfil da empresa</h1>
          <p>Edite as informações principais da empresa para manter a comunicação com os estudantes mais clara e consistente.</p>
        </div>
      </header>

      {content}
    </section>
  );
}
