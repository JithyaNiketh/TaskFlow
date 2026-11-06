import { useEffect, useState } from "react";
import { Check, LockKeyhole, Save, UserRound } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./Account.css";

const demo_id = "cf445616-9ba4-480b-8377-3009b81e791b";

function Account() {
  const { user, updateProfile, changePassword } = useAuth();

  const isDemoAccount = user?.id === demo_id;

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
  }, [user?.name, user?.email]);

  const initials =
    user?.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U";

  async function handleProfileSubmit(event) {
    event.preventDefault();

    if (isDemoAccount) return;

    setProfileMessage("");
    setProfileError("");

    if (name.trim().length < 2) {
      setProfileError("Your name must contain at least 2 characters.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setProfileError("Enter a valid email address.");
      return;
    }

    setSavingProfile(true);

    try {
      await updateProfile({ name: name.trim(), email: email.trim() });
      setProfileMessage("Your personal information has been updated.");
    } catch (error) {
      setProfileError(error.message || "Couldn't update your profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    if (isDemoAccount) return;

    setPasswordMessage("");
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("Your new password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Your new passwords don't match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("Choose a password different from your current one.");
      return;
    }

    setSavingPassword(true);

    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
      });

      setPasswordMessage(result.message || "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordError(error.message || "Couldn't update your password.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <main className="account-page">
      <header className="account-page-header">
        <div>
          <span className="account-eyebrow">SETTINGS</span>
          <h1>Account details</h1>
          <p>Manage your personal information and account security.</p>
        </div>
      </header>

      {isDemoAccount && (
        <div className="account-demo-notice" role="status">
          <LockKeyhole size={18} />
          <span>
            This is a demo account. Changes to personal information and password are not allowed.
          </span>
        </div>
      )}

      <section className="account-card account-profile-card">
        <div className="account-card-heading">
          <div className="account-heading-icon">
            <UserRound size={19} />
          </div>
          <div>
            <h2>Personal information</h2>
            <p>Update the details associated with your account.</p>
          </div>
        </div>

        <div className="account-identity">
          <div className="account-avatar">{initials}</div>
          <div>
            <h3>{user?.name || "Your account"}</h3>
            <p>{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="account-form">
          <div className="account-form-grid">
            <label className="account-field">
              <span>Full name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={100}
                autoComplete="name"
                required
                disabled={isDemoAccount}
              />
            </label>

            <label className="account-field">
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={254}
                autoComplete="email"
                required
                disabled={isDemoAccount}
              />
            </label>
          </div>

          {profileError && (
            <span className="account-feedback account-feedback-error" role="alert">
              {profileError}
            </span>
          )}

          {profileMessage && (
            <span className="account-feedback account-feedback-success" role="status">
              <Check size={15} />
              {profileMessage}
            </span>
          )}

          <div className="account-form-actions">
            <button
              type="submit"
              className="account-save-button"
              disabled={isDemoAccount || savingProfile}
            >
              <Save size={16} />
              {savingProfile ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </section>

      <section className="account-card">
        <div className="account-card-heading">
          <div className="account-heading-icon">
            <LockKeyhole size={19} />
          </div>
          <div>
            <h2>Password and security</h2>
            <p>Use your current password to set a new one.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="account-form">
          <label className="account-field">
            <span>Current password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={isDemoAccount}
            />
          </label>

          <div className="account-form-grid">
            <label className="account-field">
              <span>New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                autoComplete="new-password"
                required
                disabled={isDemoAccount}
              />
              <small>At least 8 characters.</small>
            </label>

            <label className="account-field">
              <span>Confirm new password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                autoComplete="new-password"
                required
                disabled={isDemoAccount}
              />
            </label>
          </div>

          {passwordError && (
            <span className="account-feedback account-feedback-error" role="alert">
              {passwordError}
            </span>
          )}

          {passwordMessage && (
            <span className="account-feedback account-feedback-success" role="status">
              <Check size={15} />
              {passwordMessage}
            </span>
          )}

          <div className="account-form-actions">
            <button
              type="submit"
              className="account-save-button"
              disabled={isDemoAccount || savingPassword}
            >
              <LockKeyhole size={16} />
              {savingPassword ? "Updating..." : "Update password"}
            </button>
          </div>
        </form>
      </section>

      <section className="account-card account-meta-card">
        <div>
          <h2>Account information</h2>
          <p>Details associated with your TaskFlow account.</p>
        </div>

        <div className="account-meta-row">
          <span>Account ID</span>
          <code>{user?.id || "—"}</code>
        </div>

        <div className="account-meta-row">
          <span>Member since</span>
          <span>
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "Unavailable"}
          </span>
        </div>
      </section>
    </main>
  );
}

export default Account;
