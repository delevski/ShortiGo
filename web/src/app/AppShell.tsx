import {
  Compass,
  Flame,
  Gift,
  Home,
  LogIn,
  LogOut,
  PlaySquare,
  Sparkles,
  UserRound,
  Wallet,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { formatAuthError } from "../shared/authErrors";
import { useAuth } from "./AuthContext";
import { ShortiGoLogo } from "../components/ShortiGoLogo";
import { useToast } from "../components/Toast";

const navItems = [
  { to: "/", label: "For You", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/trending", label: "Trending", icon: Flame },
  { to: "/following", label: "Following", icon: Sparkles },
  { to: "/rewards", label: "Rewards", icon: Gift },
  { to: "/my-list", label: "My List", icon: PlaySquare },
  { to: "/profile", label: "Profile", icon: UserRound },
];

function ShellNav({ compact = false }: { compact?: boolean }) {
  return (
    <nav className={compact ? "shell-nav shell-nav--mobile" : "shell-nav"} aria-label="Primary">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `shell-nav__link${isActive ? " shell-nav__link--active" : ""}`
            }
          >
            <Icon aria-hidden="true" size={compact ? 21 : 20} strokeWidth={2.25} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { appUser, authUser, configReady, loading, loginWithGoogle, logout } = useAuth();
  const { showToast } = useToast();
  const displayName = appUser?.displayName || authUser?.displayName || "Creator";
  const coins = appUser?.coins ?? 0;
  const bonus = appUser?.bonus ?? 0;

  const handleAuthClick = async () => {
    try {
      if (authUser) {
        await logout();
        showToast("Signed out.", "success");
        return;
      }

      await loginWithGoogle();
      showToast("Welcome to ShortiGo.", "success");
    } catch (error) {
      showToast(formatAuthError(error), "error");
    }
  };

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <NavLink to="/" className="brand-link" aria-label="ShortiGo home">
          <ShortiGoLogo size={42} />
          <span>ShortiGo</span>
        </NavLink>
        <ShellNav />
        <div className="sidebar-spotlight">
          <Sparkles aria-hidden="true" size={18} />
          <span>Fresh shorts, daily rewards.</span>
        </div>
      </aside>

      <div className="app-shell__main">
        <header className="topbar">
          <NavLink to="/" className="topbar__brand" aria-label="ShortiGo home">
            <ShortiGoLogo size={34} />
            <span>ShortiGo</span>
          </NavLink>
          <div className="topbar__actions">
            <NavLink className="wallet-chip" to="/wallet" aria-label="Wallet">
              <Wallet aria-hidden="true" size={18} />
              <span>{coins}</span>
              <small>+{bonus}</small>
            </NavLink>
            <button
              className="auth-button"
              type="button"
              onClick={handleAuthClick}
              disabled={!configReady || loading}
            >
              {authUser ? (
                <>
                  <UserRound aria-hidden="true" size={18} />
                  <span>{displayName}</span>
                  <LogOut aria-hidden="true" size={16} />
                </>
              ) : (
                <>
                  <LogIn aria-hidden="true" size={18} />
                  <span>{configReady ? "Login" : "Offline"}</span>
                </>
              )}
            </button>
          </div>
        </header>

        <main className="app-shell__content">{children}</main>
      </div>

      <ShellNav compact />
    </div>
  );
}
