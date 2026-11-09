import { useEffect, useState, type FormEvent } from "react";
import { IconArrowRight, IconEye, IconEyeOff, IconMoon, IconSun } from "@tabler/icons-react";
import centumLogoMobile from "./assets/centum-logo.png";
import centumLogoShowcase from "./assets/centum-logo-dark.png";
import "./login.css";

type Theme = "light" | "dark";

const SHOWCASE_MESSAGES = [
  { headline: "From RFQ package to quote review.", flow: "Upload files > Check the BOM > Review the quote" },
  { headline: "Keep feasibility and parts risks in view.", flow: "Buildability > EOL parts > Lead times" },
  { headline: "Follow the work through to final approval.", flow: "RFQ intake > Costed BOM > Quote approval" },
];

function BrandBlock({ mobile = false, theme }: { mobile?: boolean; theme: Theme }) {
  const logo = mobile && theme === "light" ? centumLogoMobile : centumLogoShowcase;
  return (
    <div className={`login-brand-block${mobile ? " login-brand-mobile" : ""}`} aria-label="Centum Automation Modules, CAM 3.4, powered by BuLLM">
      <img className="login-centum-logo" src={logo} alt="Centum" />
      <span className="login-brand-name">CENTUM AUTOMATION MODULES</span>
      <span className="login-brand-version">CAM 3.4</span>
      <span className="login-brand-powered">POWERED BY <strong><span className="login-bullm-bu">Bu</span><span className="login-bullm-llm">LLM</span></strong></span>
    </div>
  );
}

export function LoginPage({
  theme,
  onToggleTheme,
  onSignIn,
}: {
  theme: Theme;
  onToggleTheme: () => void;
  onSignIn: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [carouselHeld, setCarouselHeld] = useState(false);
  const [pageHidden, setPageHidden] = useState(() => document.hidden);

  useEffect(() => {
    const onVisibility = () => setPageHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  useEffect(() => {
    if (carouselHeld || pageHidden || SHOWCASE_MESSAGES.length < 2) return;
    const timer = window.setInterval(() => setMessageIndex(index => (index + 1) % SHOWCASE_MESSAGES.length), 6000);
    return () => window.clearInterval(timer);
  }, [carouselHeld, pageHidden]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    await new Promise(resolve => window.setTimeout(resolve, 450));
    setPassword("");
    onSignIn();
  };

  return (
    <main className="login-page">
      <div className="login-frame">
        <section className="login-showcase" aria-label="CAM RFQ workspace">
          <div className="login-showcase-inner">
            <BrandBlock theme={theme} />
            <div className="login-story" onMouseEnter={() => setCarouselHeld(true)} onMouseLeave={() => setCarouselHeld(false)}>
              <div className="login-story-copy" aria-live="polite" key={messageIndex}>
                <span className="login-story-label">BUILT AROUND YOUR RFQ</span>
                <h2>{SHOWCASE_MESSAGES[messageIndex].headline}</h2>
                <p>{SHOWCASE_MESSAGES[messageIndex].flow}</p>
              </div>
              <div className="login-story-indicators" aria-hidden="true">
                {SHOWCASE_MESSAGES.map((message, index) => <span key={message.headline} className={`login-story-dot${index === messageIndex ? " is-active" : ""}`} />)}
              </div>
            </div>
            <div className="login-showcase-foot" aria-label="Workflow areas">
              <span className="login-foot-chip">RFQ intake</span><span className="login-foot-chip">BOM analysis</span><span className="login-foot-chip">Quote review</span>
            </div>
          </div>
        </section>

        <section className="login-form-panel" aria-labelledby="login-title">
          <button className="login-theme-toggle" type="button" onClick={onToggleTheme}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}>
            {theme === "light" ? <IconMoon size={17} /> : <IconSun size={17} />}
          </button>
          <div className="login-form-content">
            <BrandBlock mobile theme={theme} />
            <div className="login-copy">
              <span className="login-eyebrow">YOUR RFQ WORKSPACE</span>
              <h2 id="login-title">Welcome back</h2>
            </div>
            <form className="login-form" onSubmit={submit}>
              <label htmlFor="cam-login-email">Work email</label>
              <input id="cam-login-email" type="email" autoComplete="username" placeholder="you@company.com"
                value={email} onChange={event => setEmail(event.target.value)} required disabled={busy} />
              <div className="login-password-label"><label htmlFor="cam-login-password">Password</label></div>
              <div className="login-password-wrap">
                <input id="cam-login-password" type={showPassword ? "text" : "password"} autoComplete="current-password"
                  placeholder="Enter password" value={password} onChange={event => setPassword(event.target.value)} required disabled={busy} />
                <button type="button" className="login-password-toggle" onClick={() => setShowPassword(value => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} disabled={busy}>
                  {showPassword ? <IconEyeOff size={19} /> : <IconEye size={19} />}
                </button>
              </div>
              <button className="login-submit" type="submit" disabled={busy}>
                {busy ? "Opening demo..." : <>Sign in <IconArrowRight size={18} /></>}
              </button>
            </form>
            <p className="login-demo-note">Demo sign-in only. Use any email and password; nothing is sent or saved.</p>
            <div className="login-secure-note"><span className="login-secure-dot" /> Mock access for this browser session</div>
          </div>
        </section>
      </div>
    </main>
  );
}
