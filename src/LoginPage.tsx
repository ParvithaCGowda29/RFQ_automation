import { useEffect, useState, type FormEvent } from "react";
import { IconArrowLeft, IconArrowRight, IconCheck, IconEye, IconEyeOff, IconMoon, IconSun } from "@tabler/icons-react";
import camLogoBlack from "./assets/cam-bom-automation-black.png";
import camLogoWhite from "./assets/cam-bom-automation-white.png";
import "./login.css";

type Theme = "light" | "dark";

const SHOWCASE_MESSAGES = [
  { headline: "From RFQ package to quote review.", flow: "Upload files > Check the BOM > Review the quote" },
  { headline: "Keep feasibility and parts risks in view.", flow: "Buildability > EOL parts > Lead times" },
  { headline: "Follow the work through to final approval.", flow: "RFQ intake > Costed BOM > Quote approval" },
];

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
  const [carouselRestart, setCarouselRestart] = useState(0);

  useEffect(() => {
    const onVisibility = () => setPageHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  useEffect(() => {
    if (carouselHeld || pageHidden || SHOWCASE_MESSAGES.length < 2) return;
    const timer = window.setInterval(() => setMessageIndex(index => (index + 1) % SHOWCASE_MESSAGES.length), 6000);
    return () => window.clearInterval(timer);
  }, [carouselHeld, pageHidden, carouselRestart]);
  const moveMessage = (delta: number) => {
    setMessageIndex(index => (index + delta + SHOWCASE_MESSAGES.length) % SHOWCASE_MESSAGES.length);
    setCarouselRestart(value => value + 1);
  };

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
        <section className="login-showcase" aria-label="CAM BOM Automation workflow">
          <div className="login-glow login-glow-a" />
          <div className="login-glow login-glow-b" />
          <div className="login-showcase-inner">
            <div className="login-kicker"><span className="login-kicker-dot" /> RFQ WORKFLOW</div>
            <h1>From RFQ package<br />to quote review.</h1>
            <p>Follow each step from file intake and BOM analysis to a quote ready for approval.</p>
            <div className="login-flow" aria-label="Workflow steps">
              <div className="login-flow-step"><span className="login-flow-icon"><IconCheck size={17} /></span><span>Ingest RFQ</span></div>
              <span className="login-flow-line" />
              <div className="login-flow-step"><span className="login-flow-icon"><IconCheck size={17} /></span><span>Analyze BOM</span></div>
              <span className="login-flow-line" />
              <div className="login-flow-step active"><span className="login-flow-icon"><IconArrowRight size={17} /></span><span>Review quote</span></div>
            </div>
            <div className="login-story" onMouseEnter={() => setCarouselHeld(true)} onMouseLeave={() => setCarouselHeld(false)}
              onFocus={() => setCarouselHeld(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setCarouselHeld(false); }}>
              <div className="login-story-copy" aria-live="polite" key={messageIndex}>
                <span className="login-story-label">BUILT AROUND YOUR RFQ</span>
                <h2>{SHOWCASE_MESSAGES[messageIndex].headline}</h2>
                <p>{SHOWCASE_MESSAGES[messageIndex].flow}</p>
              </div>
              <div className="login-story-controls">
                <div className="login-story-dots" aria-label="Workflow highlights">
                  {SHOWCASE_MESSAGES.map((message, index) => <button key={message.headline} type="button"
                    className="login-story-dot" aria-label={`Show highlight ${index + 1} of ${SHOWCASE_MESSAGES.length}`}
                    aria-current={index === messageIndex ? "true" : undefined} onClick={() => { setMessageIndex(index); setCarouselRestart(value => value + 1); }} />)}
                </div>
                <div className="login-story-arrows">
                  <button type="button" aria-label="Previous highlight" onClick={() => moveMessage(-1)}><IconArrowLeft size={17} /></button>
                  <button type="button" aria-label="Next highlight" onClick={() => moveMessage(1)}><IconArrowRight size={17} /></button>
                </div>
              </div>
            </div>
            <div className="login-showcase-foot"><span className="login-foot-chip">RFQ intake</span><span className="login-foot-chip">BOM analysis</span><span className="login-foot-chip">Quote review</span></div>
          </div>
        </section>

        <section className="login-form-panel" aria-labelledby="login-title">
          <button className="login-theme-toggle" type="button" onClick={onToggleTheme}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}>
            {theme === "light" ? <IconMoon size={17} /> : <IconSun size={17} />}
          </button>
          <div className="login-brand-block">
            <img className="login-logo" src={theme === "light" ? camLogoBlack : camLogoWhite} alt="CAM BOM Automation" />
            <p className="login-tagline">Enterprise workflows, intelligently automated.</p>
          </div>
          <div className="login-copy">
            <span className="login-eyebrow">YOUR RFQ WORKSPACE</span>
            <h2 id="login-title">Welcome back</h2>
            <p>Sign in to continue to CAM BOM Automation.</p>
          </div>
          <form className="login-form" onSubmit={submit}>
            <label htmlFor="cam-login-email">Work email</label>
            <input id="cam-login-email" type="email" autoComplete="username" placeholder="you@company.com"
              value={email} onChange={event => setEmail(event.target.value)} required disabled={busy} />
            <div className="login-password-label"><label htmlFor="cam-login-password">Password</label></div>
            <div className="login-password-wrap">
              <input id="cam-login-password" type={showPassword ? "text" : "password"} autoComplete="current-password"
                placeholder="Enter your password" value={password} onChange={event => setPassword(event.target.value)} required disabled={busy} />
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
        </section>
      </div>
    </main>
  );
}
