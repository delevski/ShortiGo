import { Link } from "react-router-dom";
import { useAuth } from "../../app/AuthContext";

export function ProfilePage() {
  const { appUser, authUser, logout } = useAuth();

  if (!authUser) {
    return (
      <section className="page-surface">
        <h1>Profile</h1>
        <Link className="primary-pill" to="/login">Log in</Link>
      </section>
    );
  }

  return (
    <section className="page-surface profile-grid">
      <div className="profile-summary">
        <h1>{appUser?.displayName || authUser.displayName || authUser.email || "ShortiGo user"}</h1>
        <p>{appUser?.isVip ? "VIP active" : "Free account"}</p>
        <button className="wallet-pill" type="button" onClick={() => void logout()}>Sign out</button>
      </div>
      <div className="wallet-card"><span>Coins</span><strong>{appUser?.coins ?? 0}</strong></div>
      <div className="wallet-card"><span>Bonus</span><strong>{appUser?.bonus ?? 0}</strong></div>
    </section>
  );
}
