import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { CreateCompanyProfileInput } from "../../services/companies";

export type CompanyProfileFormValues = {
  logoUrl: string;
  tradeName: string;
  legalName: string;
  commercialPhone: string;
  businessSector: string;
  cultureDescription: string;
};

type CompanyProfileFormProps = {
  initialValues?: CompanyProfileFormValues;
  submitLabel: string;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (data: CreateCompanyProfileInput) => Promise<void>;
  onLogoChange?: (logoUrl: string) => void;
};

const defaultValues: CompanyProfileFormValues = {
  logoUrl: "",
  tradeName: "",
  legalName: "",
  commercialPhone: "",
  businessSector: "",
  cultureDescription: "",
};

function hasText(value: string) {
  return value.trim().length > 0;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Não foi possível carregar a imagem selecionada."));
    reader.readAsDataURL(file);
  });
}

export function CompanyProfileForm({
  initialValues,
  submitLabel,
  isSubmitting,
  error,
  onSubmit,
  onLogoChange,
}: CompanyProfileFormProps) {
  const values = useMemo(() => initialValues ?? defaultValues, [initialValues]);
  const [logoUrl, setLogoUrl] = useState(values.logoUrl);
  const [tradeName, setTradeName] = useState(values.tradeName);
  const [legalName, setLegalName] = useState(values.legalName);
  const [commercialPhone, setCommercialPhone] = useState(values.commercialPhone);
  const [businessSector, setBusinessSector] = useState(values.businessSector);
  const [cultureDescription, setCultureDescription] = useState(values.cultureDescription);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setLogoUrl(values.logoUrl);
    setTradeName(values.tradeName);
    setLegalName(values.legalName);
    setCommercialPhone(values.commercialPhone);
    setBusinessSector(values.businessSector);
    setCultureDescription(values.cultureDescription);
  }, [values]);

  async function handleLogoInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setLogoError("Selecione um arquivo de imagem válido.");
      return;
    }

    if (file.size > 1500 * 1024) {
      setLogoError("A imagem é muito grande. Selecione outra imagem com no máximo 1,5MB.");
      return;
    }

    try {
      const nextLogoUrl = await readFileAsDataUrl(file);
      setLogoUrl(nextLogoUrl);
      setLogoError(null);
      onLogoChange?.(nextLogoUrl);
    } catch (uploadError) {
      setLogoError(uploadError instanceof Error ? uploadError.message : "Não foi possível carregar a imagem.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      logoUrl: logoUrl || undefined,
      tradeName: tradeName.trim(),
      legalName: legalName.trim(),
      commercialPhone: hasText(commercialPhone) ? commercialPhone.trim() : undefined,
      businessSector: hasText(businessSector) ? businessSector.trim() : undefined,
      cultureDescription: hasText(cultureDescription) ? cultureDescription.trim() : undefined,
      about: hasText(cultureDescription) ? cultureDescription.trim() : undefined,
      name: tradeName.trim(),
    });
  }

  return (
    <form className="auth-form profile-form profile-form--company" onSubmit={handleSubmit}>
      <div className="profile-form__photo-upload">
        <button
          className="profile-form__photo-trigger"
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          {logoUrl ? (
            <img className="profile-form__photo-preview" src={logoUrl} alt="Pré-visualização do logo" />
          ) : (
            <span className="profile-form__photo-placeholder">Logo</span>
          )}
          <span className="profile-form__photo-badge">Trocar ícone</span>
        </button>
        <input
          ref={fileInputRef}
          className="profile-form__file-input"
          type="file"
          accept="image/*"
          onChange={handleLogoInput}
        />
        <div>
          <strong>Ícone da empresa</strong>
          <p className="profile-form__hint">Clique no quadro para enviar uma imagem de até 1,5MB.</p>
          {logoError ? <p className="form-error">{logoError}</p> : null}
        </div>
      </div>

      <div className="profile-form__grid profile-form__grid--company">
        <label className="field">
          <span>Nome Fantasia</span>
          <input value={tradeName} onChange={(event) => setTradeName(event.target.value)} required />
        </label>

        <label className="field">
          <span>Razão Social</span>
          <input value={legalName} onChange={(event) => setLegalName(event.target.value)} required />
        </label>

        <label className="field">
          <span>Telefone / WhatsApp Comercial</span>
          <input value={commercialPhone} onChange={(event) => setCommercialPhone(event.target.value)} placeholder="(92) 99999-9999" />
        </label>

        <label className="field">
          <span>Setor de Atuação</span>
          <input value={businessSector} onChange={(event) => setBusinessSector(event.target.value)} placeholder="Tecnologia" />
        </label>

        <label className="field profile-form__field--full">
          <span>Breve Descrição / Cultura da Empresa</span>
          <textarea value={cultureDescription} onChange={(event) => setCultureDescription(event.target.value)} rows={6} />
        </label>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="profile-form__actions">
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
