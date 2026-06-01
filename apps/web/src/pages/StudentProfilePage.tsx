import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { StudentProfileForm, type StudentProfileFormValues } from "../components/profile/StudentProfileForm";
import { useAuth } from "../auth/AuthProvider";
import {
  formatAvailabilityList,
  getMyStudentProfile,
  updateStudentProfile,
  type StudentProfile,
} from "../services/students";
import { readImageAsCompressedDataUrl } from "../utils/image";

const skillChipTones = ["blue", "violet", "emerald", "amber", "rose", "cyan"] as const;

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function splitName(name: string) {
  const [firstName = "", ...rest] = name.split(" ").filter(Boolean);
  return {
    firstName,
    lastName: rest.join(" "),
  };
}

function hasText(value?: string | null) {
  return Boolean(value && value.trim().length > 0);
}

function getProfileFormValues(profile: StudentProfile): StudentProfileFormValues {
  const { firstName, lastName } = splitName(profile.name);

  return {
    firstName,
    lastName,
    course: profile.course,
    skills: profile.skills.join(", "),
    availability: profile.availability,
    headline: profile.headline ?? "",
    summary: profile.summary ?? "",
    city: profile.city ?? "",
    state: profile.state ?? "",
    semester: profile.semester ?? "",
    university: profile.university ?? "",
    cr: profile.cr ?? "",
    portfolio: profile.portfolio ?? "",
    photoUrl: profile.photoUrl ?? "",
  };
}

function CandidatePreviewCompact({ profile }: { profile: StudentProfile }) {
  return (
    <article className="panel profile-preview-card profile-preview-card--compact">
      <span className="panel__label">Como outros candidatos veem</span>
      <div className="profile-preview-card__identity">
        {profile.photoUrl ? (
          <img className="feed-card__avatar feed-card__avatar--image" src={profile.photoUrl} alt={profile.name} />
        ) : (
          <span className="feed-card__avatar">{getInitials(profile.name)}</span>
        )}
        <div>
          <strong>{profile.name}</strong>
          <span>{profile.course}</span>
        </div>
      </div>
      {profile.availability.length ? (
        <span className="status-pill status-pill--highlight">{formatAvailabilityList(profile.availability)}</span>
      ) : null}
      {hasText(profile.summary) ? <p>{profile.summary}</p> : null}
      {profile.skills.length ? (
        <div className="feed-card__chips">
          {profile.skills.slice(0, 4).map((skill, index) => (
            <span key={skill} className={`feed-chip feed-chip--${skillChipTones[index % skillChipTones.length]}`}>{skill}</span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function CandidatePreviewDetailed({ profile }: { profile: StudentProfile }) {
  return (
    <article className="panel profile-preview-card profile-preview-card--detailed">
      <span className="panel__label">Como empresas veem</span>
      <div className="company-candidate-card__main company-candidate-card__main--preview">
        {profile.photoUrl ? (
          <img className="company-candidate-card__avatar company-candidate-card__avatar--image" src={profile.photoUrl} alt={profile.name} />
        ) : (
          <span className="company-candidate-card__avatar" aria-hidden="true">
            {getInitials(profile.name)}
          </span>
        )}
        <div>
          <strong>{profile.name}</strong>
          <p>{profile.course}</p>
          <span>{formatAvailabilityList(profile.availability)}</span>
        </div>
      </div>
      <div className="company-candidate-detail-card__meta-grid">
        {hasText(profile.headline) ? (
          <div>
            <span>Título</span>
            <strong>{profile.headline}</strong>
          </div>
        ) : null}
        {hasText(profile.university) ? (
          <div>
            <span>Instituição</span>
            <strong>{profile.university}</strong>
          </div>
        ) : null}
        {hasText(profile.semester) ? (
          <div>
            <span>Período</span>
            <strong>{profile.semester}</strong>
          </div>
        ) : null}
        {hasText(profile.portfolio) ? (
          <div>
            <span>Portfólio</span>
            <strong>{profile.portfolio}</strong>
          </div>
        ) : null}
      </div>
      {profile.skills.length ? (
        <div className="skill-tags">
          {profile.skills.map((skill, index) => (
            <span key={skill} className={`feed-chip feed-chip--${skillChipTones[index % skillChipTones.length]}`}>{skill}</span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function StudentProfilePage() {
  const { token, user, setUser } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [initialValues, setInitialValues] = useState<StudentProfileFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const avatarPhotoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    getMyStudentProfile(token)
      .then((loadedProfile) => {
        setProfileId(loadedProfile.id);
        setProfile(loadedProfile);
        setInitialValues(getProfileFormValues(loadedProfile));
        setPreviewPhotoUrl(loadedProfile.photoUrl ?? "");
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar o perfil.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  async function handleAvatarPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!token || !profileId || !profile) {
      setPhotoMessage({ type: "error", text: "Perfil indisponível no momento." });
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPhotoMessage({ type: "error", text: "Selecione um arquivo de imagem válido." });
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setPhotoMessage({ type: "error", text: "A imagem é muito grande. Selecione uma imagem de até 25MB." });
      return;
    }

    setPhotoMessage(null);
    setIsUploadingPhoto(true);

    try {
      const nextPhotoUrl = await readImageAsCompressedDataUrl(file);
      const updatedProfile = await updateStudentProfile(profileId, { photoUrl: nextPhotoUrl }, token);

      setProfile(updatedProfile);
      setInitialValues(getProfileFormValues(updatedProfile));
      setPreviewPhotoUrl(updatedProfile.photoUrl ?? "");

      if (user) {
        setUser({ ...user, avatarUrl: updatedProfile.photoUrl ?? undefined });
      }

      setPhotoMessage({ type: "success", text: "Foto de perfil atualizada." });
    } catch (uploadError) {
      setPhotoMessage({
        type: "error",
        text: uploadError instanceof Error ? uploadError.message : "Não foi possível atualizar a foto.",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function handleSubmit(data: Parameters<typeof updateStudentProfile>[1]) {
    if (!token || !profileId) {
      setError("Perfil indisponível no momento.");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const updatedProfile = await updateStudentProfile(profileId, data, token);
      const { firstName, lastName } = splitName(updatedProfile.name);
      setProfile(updatedProfile);
      setInitialValues(getProfileFormValues(updatedProfile));
      setPreviewPhotoUrl(updatedProfile.photoUrl ?? "");
      if (user) {
        setUser({
          ...user,
          name: updatedProfile.name,
          displayName: updatedProfile.name,
          firstName,
          lastName,
          avatarUrl: updatedProfile.photoUrl ?? undefined,
        });
      }
      setSuccessMessage("Perfil atualizado com sucesso.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível atualizar o perfil.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const generalInfo = useMemo(() => {
    if (!profile) return [];

    return [
      hasText(profile.headline) ? { label: "Título", value: profile.headline as string } : null,
      hasText(profile.city) || hasText(profile.state)
        ? { label: "Localidade", value: [profile.city, profile.state].filter(Boolean).join(" • ") }
        : null,
      profile.availability.length ? { label: "Disponibilidade", value: formatAvailabilityList(profile.availability) } : null,
      hasText(profile.university) ? { label: "Instituição", value: profile.university as string } : null,
      hasText(profile.semester) ? { label: "Período", value: profile.semester as string } : null,
      hasText(profile.cr) ? { label: "CR", value: profile.cr as string } : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>;
  }, [profile]);

  if (isLoading) {
    return <section className="page-section profile-page student-profile-page student-profile-page--refined"><div className="panel"><p>Carregando perfil...</p></div></section>;
  }

  if (!profile || !initialValues) {
    return <section className="page-section profile-page student-profile-page student-profile-page--refined"><div className="panel"><p>{error ?? "Perfil não encontrado."}</p></div></section>;
  }

  const currentPhotoUrl = previewPhotoUrl || profile.photoUrl || "";

  return (
    <section className="page-section profile-page student-profile-page student-profile-page--refined">
      <div className="profile-layout profile-layout--student profile-layout--refined profile-layout--single-column">
        <div className="profile-main-stack profile-main-stack--wide">
          <section className="panel profile-hero-card profile-hero-card--refined profile-hero-card--student-modern profile-hero-card--interactive">
            <div className="profile-hero-card__media profile-hero-card__media--student">
              <div className="profile-avatar-control">
                <button
                  className="profile-avatar profile-avatar--button profile-avatar--xl"
                  type="button"
                  onClick={() => avatarPhotoInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                >
                  {currentPhotoUrl ? (
                    <img
                      className="profile-avatar profile-avatar--image profile-avatar--xl"
                      src={currentPhotoUrl}
                      alt={`Foto de ${profile.name}`}
                    />
                  ) : (
                    <span>{getInitials(profile.name)}</span>
                  )}
                  <span className="profile-avatar__edit-badge">{isUploadingPhoto ? "Enviando..." : "Trocar foto"}</span>
                </button>

                <input
                  ref={avatarPhotoInputRef}
                  className="profile-form__file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarPhotoChange}
                />

                <button
                  className="secondary-button profile-avatar-control__button"
                  type="button"
                  onClick={() => avatarPhotoInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                >
                  {isUploadingPhoto ? "Enviando..." : "Trocar foto de perfil"}
                </button>

                {photoMessage ? (
                  <p className={photoMessage.type === "success" ? "form-success" : "form-error"}>{photoMessage.text}</p>
                ) : null}
              </div>

              <div className="profile-hero-card__info">
                <span className="panel__label">Candidato</span>
                <h1 className="profile-hero-card__name">{profile.name}</h1>
                {hasText(profile.headline) ? <p className="profile-hero-card__title">{profile.headline}</p> : null}
                {profile.availability.length ? (
                  <div className="profile-meta-chips">
                    <span className="status-pill">Disponível para estágio • {formatAvailabilityList(profile.availability)}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {generalInfo.length ? (
              <div className="profile-hero-card__meta-grid profile-hero-card__meta-grid--compact">
                {generalInfo.map((item) => (
                  <article key={item.label} className="profile-info-card">
                    <span className="panel__label">{item.label}</span>
                    <strong>{item.value}</strong>
                  </article>
                ))}
              </div>
            ) : null}
          </section>

          <section className="content-grid profile-insight-grid profile-insight-grid--details profile-insight-grid--details-extended profile-insight-grid--details-profile">
            {hasText(profile.summary) ? (
              <article className="panel profile-description-card profile-description-card--summary-main">
                <span className="panel__label">Resumo profissional</span>
                <h2>Apresentação</h2>
                <p>{profile.summary}</p>
              </article>
            ) : null}

            {profile.skills.length ? (
              <article className="panel profile-description-card">
                <span className="panel__label">Habilidades</span>
                <h2>Skills em destaque</h2>
                <div className="skill-tags">
                  {profile.skills.map((skill, index) => (
                    <span key={skill} className={`feed-chip feed-chip--${skillChipTones[index % skillChipTones.length]}`}>{skill}</span>
                  ))}
                </div>
              </article>
            ) : null}

            {(hasText(profile.course) || hasText(profile.semester) || hasText(profile.university) || hasText(profile.cr)) ? (
              <article className="panel profile-description-card">
                <span className="panel__label">Dados acadêmicos</span>
                <h2>Formação</h2>
                <div className="profile-academic-grid profile-academic-grid--compact">
                  {hasText(profile.course) ? <div><strong>Curso</strong><p>{profile.course}</p></div> : null}
                  {hasText(profile.semester) ? <div><strong>Período</strong><p>{profile.semester}</p></div> : null}
                  {hasText(profile.university) ? <div><strong>Instituição</strong><p>{profile.university}</p></div> : null}
                  {hasText(profile.cr) ? <div><strong>CR</strong><p>{profile.cr}</p></div> : null}
                </div>
              </article>
            ) : null}

            {hasText(profile.portfolio) ? (
              <article className="panel profile-description-card profile-link-card">
                <span className="panel__label">Portfólio</span>
                <h2>Link profissional</h2>
                <a className="profile-link-card__value" href={profile.portfolio ?? "#"} target="_blank" rel="noreferrer">
                  {profile.portfolio}
                </a>
              </article>
            ) : null}
          </section>

          <section className="panel profile-panel profile-panel--refined">
            <div className="profile-panel__heading">
              <div>
                <span className="panel__label">Edição do perfil</span>
                <h2>Atualize seus dados profissionais</h2>
              </div>
            </div>
            {successMessage ? <p className="form-success">{successMessage}</p> : null}
            <StudentProfileForm
              initialValues={initialValues}
              submitLabel="Salvar alterações"
              isSubmitting={isSubmitting}
              error={error}
              onSubmit={handleSubmit}
              onPhotoChange={setPreviewPhotoUrl}
            />
          </section>

          <section className="content-grid content-grid--two profile-preview-grid">
            <CandidatePreviewDetailed profile={{ ...profile, photoUrl: currentPhotoUrl || profile.photoUrl }} />
            <CandidatePreviewCompact profile={{ ...profile, photoUrl: currentPhotoUrl || profile.photoUrl }} />
          </section>
        </div>
      </div>
    </section>
  );
}
