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
      <div className="panel profile-panel">
        {successMessage ? <p className="form-success">{successMessage}</p> : null}
        <CompanyProfileForm
          initialValues={initialValues}
          submitLabel="Salvar alterações"
          isSubmitting={isSubmitting}
          error={error}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }, [error, handleSubmit, initialValues, isLoading, isSubmitting, successMessage]);

  return (
    <section className="page-section profile-page">
      <header className="page-header">
        <div>
          <span className="page-eyebrow">Meu perfil</span>
          <h1>Perfil da empresa</h1>
          <p>Atualize o nome e a descrição da empresa para apresentar melhor sua organização aos estudantes.</p>
        </div>
      </header>

      {content}
    </section>
  );
}
