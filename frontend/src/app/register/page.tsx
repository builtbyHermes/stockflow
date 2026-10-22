
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import styles from "./register.module.css";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isSubmitting || submitted) return;

    setErrorMessage("");
    setSubmitted(false);

    if (!agreeTerms) {
      setErrorMessage(
        "Please agree to the Terms & Conditions to proceed."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post<{
        message: string;
        user: {
          id: string;
          name: string;
          email: string;
          role: string;
        };
      }>("/api/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      setSubmitted(true);

      setTimeout(() => {
        router.push("/login");
      }, 1800);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.container}>
      {/* Left side: Registration Form */}
      <div className={styles.leftSection}>
        <header>
          <Link href="/" className={styles.brand}>
            <div className={styles.brandIcon} aria-hidden="true">
              <span className={styles.brandTile} />
              <span className={styles.brandTile} />
              <span className={styles.brandTile} />
              <span className={styles.brandTile} />
            </div>
            <span className={styles.brandName}>Stoki</span>
          </Link>
        </header>

        <main className={styles.formWrapper}>
          <h1 className={styles.title}>Create an account</h1>

          {errorMessage && (
            <div className={styles.alertBox} role="alert">
              {errorMessage}
            </div>
          )}

          {submitted && (
            <div className={styles.alertBox} role="status">
              ✓ Account created successfully! Redirecting to login...
            </div>
          )}

          <form onSubmit={handleRegister} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label htmlFor="reg-name" className={styles.label}>
                Name
              </label>

              <div className={styles.inputWrapper}>
                <input
                  id="reg-name"
                  name="name"
                  type="text"
                  required
                  maxLength={100}
                  autoComplete="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.input}
                  disabled={isSubmitting || submitted}
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="reg-email" className={styles.label}>
                Email
              </label>

              <div className={styles.inputWrapper}>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  placeholder="Enter your mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  disabled={isSubmitting || submitted}
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="reg-password" className={styles.label}>
                Password
              </label>

              <div className={styles.inputWrapper}>
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  disabled={isSubmitting || submitted}
                />

                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  disabled={isSubmitting || submitted}
                >
                  {showPassword ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <label className={styles.checkboxContainer}>
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className={styles.checkbox}
                disabled={isSubmitting || submitted}
              />

              <span className={styles.checkboxLabel}>
                I agree to all the{" "}
                <span className={styles.termsLink}>
                  Terms &amp; Conditions
                </span>
              </span>
            </label>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting || submitted}
            >
              {isSubmitting
                ? "Creating account..."
                : submitted
                  ? "Account created"
                  : "Sign up"}
            </button>

            <div className={styles.divider}>
              <span className={styles.dividerText}>Or</span>
            </div>

            <div className={styles.socialRow}>
              <button
                type="button"
                className={styles.socialBtn}
                onClick={() => router.push("/login")}
                disabled={isSubmitting || submitted}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                Google
              </button>

              <button
                type="button"
                className={styles.socialBtn}
                onClick={() => router.push("/login")}
                disabled={isSubmitting || submitted}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 23 23"
                  aria-hidden="true"
                >
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
                Microsoft
              </button>
            </div>

            <p className={styles.bottomText}>
              Already have an account?{" "}
              <Link href="/login" className={styles.loginLink}>
                Log in
              </Link>
            </p>
          </form>
        </main>

        <footer style={{ height: 20 }} />
      </div>

      {/* Right side: Dark Forest Green Showcase */}
      <div className={styles.rightSection} aria-hidden="true">
        {/* Decorative Floating Squares */}
        <span className={`${styles.floatingTile} ${styles.tile1}`} />
        <span className={`${styles.floatingTile} ${styles.tile2}`} />
        <span className={`${styles.floatingTile} ${styles.tile3}`} />
        <span className={`${styles.floatingTile} ${styles.tile4}`} />
        <span className={`${styles.floatingTile} ${styles.tile5}`} />
        <span className={`${styles.floatingTile} ${styles.tile6}`} />
        <span className={`${styles.floatingTile} ${styles.tile7}`} />
        <span className={`${styles.floatingTile} ${styles.tile8}`} />
        <span className={`${styles.floatingTile} ${styles.tile9}`} />
        <span className={`${styles.floatingTile} ${styles.tile10}`} />
        <span className={`${styles.floatingTile} ${styles.tile11}`} />

        <div className={styles.visualContainer}>
          {/* Analytics Line Chart Card */}
          <div className={styles.analyticsCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Analytics</span>

              <div className={styles.periodTabs}>
                <span
                  className={`${styles.periodTab} ${styles.periodTabActive}`}
                >
                  Weekly
                </span>
                <span className={styles.periodTab}>Monthly</span>
                <span className={styles.periodTab}>Yearly</span>
              </div>
            </div>

            <div className={styles.chartContainer}>
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 340 120"
                preserveAspectRatio="none"
              >
                {/* Horizontal reference lines */}
                <line
                  x1="0"
                  y1="20"
                  x2="340"
                  y2="20"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="50"
                  x2="340"
                  y2="50"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="80"
                  x2="340"
                  y2="80"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />

                {/* Primary trend line */}
                <path
                  d="M 10 90 L 80 40 L 150 70 L 220 50 L 290 85 L 330 45"
                  fill="none"
                  stroke="#52796F"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Secondary trend line */}
                <path
                  d="M 10 60 L 80 80 L 150 50 L 220 65 L 290 55 L 330 40"
                  fill="none"
                  stroke="#84A98C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* X-axis Day Labels */}
                <text
                  x="10"
                  y="115"
                  fontSize="10"
                  fill="#94a3b8"
                  fontWeight="600"
                >
                  MON
                </text>
                <text
                  x="80"
                  y="115"
                  fontSize="10"
                  fill="#94a3b8"
                  fontWeight="600"
                >
                  TUE
                </text>
                <text
                  x="150"
                  y="115"
                  fontSize="10"
                  fill="#94a3b8"
                  fontWeight="600"
                >
                  WED
                </text>
                <text
                  x="220"
                  y="115"
                  fontSize="10"
                  fill="#94a3b8"
                  fontWeight="600"
                >
                  THU
                </text>
                <text
                  x="290"
                  y="115"
                  fontSize="10"
                  fill="#94a3b8"
                  fontWeight="600"
                >
                  FRI
                </text>
              </svg>
            </div>
          </div>

          {/* Overlapping Donut Chart Card */}
          <div className={styles.donutCard}>
            <div className={styles.donutWrapper}>
              <svg width="140" height="140" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="14"
                />

                {/* 42% Progress Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#083a2d"
                  strokeWidth="14"
                  strokeDasharray="251.32"
                  strokeDashoffset="145.76"
                  strokeLinecap="butt"
                  transform="rotate(-90 50 50)"
                />
              </svg>

              <div className={styles.donutText}>
                <div className={styles.donutSub}>Total</div>
                <div className={styles.donutValue}>42%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Copy Below Cards */}
        <div className={styles.showcaseCopy}>
          <h2 className={styles.showcaseHeading}>
            Very simple way you can engage
          </h2>
          <p className={styles.showcaseSubtitle}>
            Welcome to Stoki Inventory Management System! Efficiently track
            and manage your inventory with ease.
          </p>
        </div>
      </div>
    </div>
  );
}
