import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { CompanyProfileForm, type CompanyProfileFormValues } from "../components/profile/CompanyProfileForm";
import { getMyCompanyProfile, updateCompanyProfile } from "../services/companies";

export function CompanyProfilePage() {
  const { token, refreshCurrentUser } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<CompanyProfileFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewLogoUrl, setPreviewLogoUrl] = useState("");

  useEffect(() => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    getMyCompanyProfile(token)
      .then((profile) => {
        setProfileId(profile.id);
        setInitialValues({
          logoUrl: profile.logoUrl ?? "",
          tradeName: profile.tradeName ?? profile.name,
          legalName: profile.legalName ?? profile.name,
          commercialPhone: profile.commercialPhone ?? "",
          businessSector: profile.businessSector ?? "",
          cultureDescription: profile.cultureDescription ?? profile.about ?? "",
        });
        setPreviewLogoUrl(profile.logoUrl ?? "");
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
        logoUrl: updatedProfile.logoUrl ?? "",
        tradeName: updatedProfile.tradeName ?? updatedProfile.name,
        legalName: updatedProfile.legalName ?? updatedProfile.name,
        commercialPhone: updatedProfile.commercialPhone ?? "",
        businessSector: updatedProfile.businessSector ?? "",
        cultureDescription: updatedProfile.cultureDescription ?? updatedProfile.about ?? "",
      });
      setPreviewLogoUrl(updatedProfile.logoUrl ?? "");
      await refreshCurrentUser();
      setSuccessMessage("Perfil atualizado com sucesso.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível atualizar o perfil.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <section className="page-section profile-page company-profile-page company-profile-page--simple"><div className="panel"><p>Carregando perfil...</p></div></section>;
  }

  if (!initialValues) {
    return <section className="page-section profile-page company-profile-page company-profile-page--simple"><div className="panel"><p>{error ?? "Perfil não encontrado."}</p></div></section>;
  }

  return (
    <section className="page-section profile-page company-profile-page company-profile-page--simple">
      <section className="panel company-profile-form-panel">
        <div className="company-profile-form-panel__header">
          <div className="company-profile-form-panel__identity">
            {previewLogoUrl ? (
              <img className="company-profile-form-panel__logo" src={previewLogoUrl} alt={initialValues.tradeName} />
            ) : (
              <span className="company-profile-form-panel__logo company-profile-form-panel__logo--placeholder">
                {initialValues.tradeName.slice(0, 2).toUpperCase()}
              </span>
            )}
            <div>
              <span className="panel__label">Meu perfil</span>
              <h1>{initialValues.tradeName}</h1>
            </div>
          </div>
        </div>

        {successMessage ? <p className="form-success">{successMessage}</p> : null}
        <CompanyProfileForm
          initialValues={initialValues}
          submitLabel="Salvar alterações"
          isSubmitting={isSubmitting}
          error={error}
          onSubmit={handleSubmit}
          onLogoChange={setPreviewLogoUrl}
        />
      </section>
    </section>
  );
}
