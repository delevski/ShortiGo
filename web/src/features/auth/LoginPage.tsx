import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/Toast";
import { auth } from "../../firebase/firebase";
import { formatAuthError } from "../../shared/authErrors";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const navigate = useNavigate();
  const { showToast } = useToast();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!auth) {
      showToast("Firebase web config is missing.", "error");
      return;
    }
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate("/shorts");
    } catch (error) {
      showToast(formatAuthError(error), "error");
    }
  };

  const google = async () => {
    if (!auth) {
      showToast("Firebase web config is missing.", "error");
      return;
    }
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate("/shorts");
    } catch (error) {
      showToast(formatAuthError(error), "error");
    }
  };

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>{mode === "login" ? "Log in" : "Create account"}</h1>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            minLength={6}
            required
          />
        </label>
        <button className="primary-pill" type="submit">Continue</button>
        <button className="wallet-pill" type="button" onClick={google}>Continue with Google</button>
        <button
          className="text-button"
          type="button"
          onClick={() => setMode((current) => (current === "login" ? "signup" : "login"))}
        >
          {mode === "login" ? "Create an account" : "I already have an account"}
        </button>
      </form>
    </section>
  );
}
