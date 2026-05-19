import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthProvider";
import { updateCurrentUser, updateCurrentUserPassword } from "../services/auth";

export function SettingsPage() {
  const { token, user, setUser } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [accountError, setAccountError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [accountSuccess, setAccountSuccess] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    setEmail(user?.email ?? "");
  }, [user?.email]);

  async function handleAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setAccountError("Sessão inválida. Faça login novamente.");
      return;
    }

    setIsSavingAccount(true);
    setAccountError(null);
    setAccountSuccess(null);

    try {
      const updatedUser = await updateCurrentUser({ email }, token);
      setUser(updatedUser);
      setAccountSuccess("Conta atualizada com sucesso.");
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Não foi possível atualizar a conta.");
    } finally {
      setIsSavingAccount(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setPasswordError("Sessão inválida. Faça login novamente.");
      return;
    }

    setIsSavingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      await updateCurrentUserPassword({ currentPassword, newPassword }, token);
      setCurrentPassword("");
      setNewPassword("");
      setPasswordSuccess("Senha alterada com sucesso.");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Não foi possível alterar a senha.");
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <section className="page-section settings-page settings-page--refined">
      <header className="page-header settings-page__header">
        <div>
          <span className="page-eyebrow">Conta</span>
          <h1>Conta e segurança</h1>
          <p>Atualize seu email de acesso e altere sua senha sem sair da plataforma.</p>
        </div>
      </header>

      <section className="content-grid content-grid--three settings-page__grid">
        <article className="panel settings-card settings-card--interactive">
          <span className="panel__label">Perfil de acesso</span>
          <strong>{user?.name ?? user?.email ?? "Usuário"}</strong>
          <p>{user?.role === "COMPANY" ? "Conta vinculada a empresa" : user?.role === "STUDENT" ? "Conta vinculada a candidato" : "Conta de coordenação"}</p>
        </article>
        <article className="panel settings-card settings-card--interactive">
          <span className="panel__label">Email atual</span>
          <strong>{user?.email ?? "Não disponível"}</strong>
          <p>Usado para login e recuperação de acesso.</p>
        </article>
        <article className="panel settings-card settings-card--interactive">
          <span className="panel__label">Segurança</span>
          <strong>Senha protegida</strong>
          <p>Troque sua senha sempre que precisar reforçar a segurança da conta.</p>
        </article>
      </section>

      <section className="settings-page__content settings-account-layout">
        <article className="panel settings-card settings-card--wide settings-form-card">
          <div>
            <span className="panel__label">Dados da conta</span>
            <h2>Atualizar email</h2>
            <p>Mantenha o email de acesso sempre atualizado.</p>
          </div>

          {accountSuccess ? <p className="form-success">{accountSuccess}</p> : null}
          {accountError ? <p className="form-error">{accountError}</p> : null}

          <form className="auth-form settings-form" onSubmit={handleAccountSubmit}>
            <label className="field">
              <span>Email</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>

            <div className="profile-form__actions">
              <button className="primary-button" type="submit" disabled={isSavingAccount}>
                {isSavingAccount ? "Salvando..." : "Salvar email"}
              </button>
            </div>
          </form>
        </article>

        <article className="panel settings-card settings-card--wide settings-form-card">
          <div>
            <span className="panel__label">Segurança</span>
            <h2>Alterar senha</h2>
            <p>Use uma nova senha com pelo menos 6 caracteres.</p>
          </div>

          {passwordSuccess ? <p className="form-success">{passwordSuccess}</p> : null}
          {passwordError ? <p className="form-error">{passwordError}</p> : null}

          <form className="auth-form settings-form" onSubmit={handlePasswordSubmit}>
            <label className="field">
              <span>Senha atual</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Nova senha</span>
              <input
                type="password"
                minLength={6}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
            </label>

            <div className="profile-form__actions">
              <button className="primary-button" type="submit" disabled={isSavingPassword}>
                {isSavingPassword ? "Salvando..." : "Atualizar senha"}
              </button>
            </div>
          </form>
        </article>
      </section>
    </section>
  );
}
