import Link from "next/link";

import styles from "./page.module.css";

const partners = ["Fastship", "Overview", "Logictech", "Dropbox"];

const featureCards = [
  {
    title: "Inventory tracking",
    description: "Real-time stock visibility across locations and channels.",
  },
  {
    title: "Order management",
    description: "Track purchase orders, shipments, and fulfillment status in one place.",
  },
  {
    title: "Connected workflows",
    description: "Keep teams synced with automated handoffs and shared operational insights.",
  },
];

const testimonials = [
  {
    quote:
      "Fastship has completely changed how we manage stock and shipments across multiple warehouses.",
    author: "Camila Robertson",
    role: "Operations Lead",
  },
  {
    quote:
      "The dashboards are clear, the workflows feel fast, and our order accuracy improved within weeks.",
    author: "James Holloway",
    role: "Supply Chain Director",
  },
  {
    quote:
      "We replaced disconnected spreadsheets with a system our team actually enjoys using every day.",
    author: "Ari Patel",
    role: "Inventory Manager",
  },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.glowMint} />
        <div className={styles.glowLavender} />
        <div className={styles.colorRibbon} />

        <header className={styles.navbar}>
          <div className={styles.brand}>
            <div className={styles.brandMark}>
              <span className={styles.tileA} />
              <span className={styles.tileB} />
              <span className={styles.tileC} />
              <span className={styles.tileD} />
            </div>
            <span className={styles.brandText}>Fastship</span>
          </div>

          <nav className={styles.nav} aria-label="Main navigation">
            <a href="#">Home</a>
            <a href="#features">Features</a>
            <a href="#about">About us</a>
          </nav>

          <div className={styles.navActions}>
            <Link href="/login">Login</Link>
            <Link href="/dashboard" className={styles.primaryButton}>
              Get Started For Free
            </Link>
          </div>
        </header>

        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            Designed to streamline every step of your shipping
          </div>

          <h1>
            Streamline your shipping
            <span>
              with <strong>Fastship</strong> solutions.
            </span>
          </h1>

          <p>
            Take the complexity out of your inventory with real-time insights, seamless order
            management, and shipping that keeps your business moving.
          </p>

          <Link href="/dashboard" className={styles.primaryButtonLarge}>
            Get Started For Free
          </Link>
        </div>

        <div className={styles.dashboardMock}>
          <aside className={styles.sidebarPanel}>
            <div className={styles.sidebarBrand}>
              <div className={styles.brandMarkSmall}>
                <span className={styles.tileA} />
                <span className={styles.tileB} />
                <span className={styles.tileC} />
                <span className={styles.tileD} />
              </div>
              <span className={styles.brandText}>Fastship</span>
            </div>

            <div className={styles.sideGroup}>
              <span className={styles.sideLabel}>Workspace</span>
              <div className={styles.navItemActive}>Overview</div>
              <div className={styles.navItem}>Inventory</div>
              <div className={styles.navItem}>Orders</div>
              <div className={styles.navItem}>Shipments</div>
              <div className={styles.navItem}>Customers</div>
              <div className={styles.navItem}>Reports</div>
            </div>

            <div className={styles.helpCard}>
              <strong>Need a little help?</strong>
              <span>Our team is here to keep things moving.</span>
              <em>Contact support ↗</em>
            </div>

            <div className={styles.userCard}>
              <div className={styles.avatar} />
              <div>
                <strong>Alex Morgan</strong>
                <span>Store administrator</span>
              </div>
            </div>
          </aside>

          <div className={styles.workspaceMain}>
            <div className={styles.workspaceHeader}>
              <span>Workspace / Overview</span>
              <div className={styles.utilityRow}>
                <span>⌕ Search anything...</span>
                <span className={styles.bell}>🔔</span>
              </div>
            </div>

            <div className={styles.headingRow}>
              <div>
                <h2>Overview</h2>
                <p>Welcome back, Alex! Here&apos;s what&apos;s happening today.</p>
              </div>
              <div className={styles.filter}>Jun 1 – Jun 30, 2024 ⌄</div>
            </div>

            <div className={styles.metricRow}>
              <div className={styles.metricCardTone1}>
                <span>Total sales</span>
                <strong>$48,290</strong>
                <em>↗ 12.8% vs. last month</em>
              </div>
              <div className={styles.metricCardTone2}>
                <span>Total orders</span>
                <strong>1,842</strong>
                <em>↗ 8.2% vs. last month</em>
              </div>
              <div className={styles.metricCardTone3}>
                <span>Total revenue</span>
                <strong>$32,680</strong>
                <em>↗ 16.4% vs. last month</em>
              </div>
              <div className={styles.metricCardTone4}>
                <span>Total products</span>
                <strong>2,450</strong>
                <em>↗ 4.6% vs. last month</em>
              </div>
            </div>

            <div className={styles.chartPanel}>
              <div className={styles.chartBars}>
                <span style={{ height: "42%" }} />
                <span style={{ height: "58%" }} />
                <span style={{ height: "48%" }} />
                <span style={{ height: "70%" }} />
                <span style={{ height: "62%" }} />
                <span style={{ height: "80%" }} />
                <span style={{ height: "68%" }} />
                <span style={{ height: "86%" }} />
                <span style={{ height: "72%" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.partnerRow}>
        {partners.map((partner) => (
          <span key={partner}>{partner}</span>
        ))}
      </div>

      <section id="features" className={styles.featureSection}>
        <div className={styles.featureIntro}>
          <span className={styles.kicker}>Built for operational clarity</span>
          <h3>Inventory tracking made flexible.</h3>
          <ul>
            <li>Real-time visibility across your inventory and shipping operations.</li>
            <li>Fast order flows with fewer manual handoffs and less operator friction.</li>
            <li>Actionable dashboards that help teams resolve issues before they grow.</li>
          </ul>
        </div>

        <div className={styles.inventoryCard}>
          <div className={styles.inventoryHeader}>
            <span>Inventory</span>
            <button type="button">Today</button>
          </div>
          <div className={styles.inventoryStats}>
            <div>
              <strong>2,450</strong>
              <span>Products</span>
            </div>
            <div>
              <strong>2,384</strong>
              <span>Available</span>
            </div>
            <div>
              <strong>66</strong>
              <span>Low stock</span>
            </div>
          </div>
          <div className={styles.inventoryList}>
            <div>
              <span>Backpacks</span>
              <strong>42</strong>
            </div>
            <div>
              <span>Headphones</span>
              <strong>123</strong>
            </div>
            <div>
              <span>Smart watches</span>
              <strong>88</strong>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cardGrid}>
        {featureCards.map((feature) => (
          <article key={feature.title} className={styles.infoCard}>
            <div className={styles.iconGlyph} aria-hidden="true" />
            <h4>{feature.title}</h4>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>

      <section className={styles.testimonialsSection} id="about">
        <div className={styles.sectionHeading}>
          <span className={styles.kicker}>What our clients say</span>
          <h3>Trusted by teams that move fast.</h3>
        </div>

        <div className={styles.testimonialGrid}>
          {testimonials.map((item) => (
            <article key={item.author} className={styles.testimonialCard}>
              <div className={styles.stars} aria-label="Five star review">
                ★★★★★
              </div>
              <p>{item.quote}</p>
              <div className={styles.personRow}>
                <div className={styles.personAvatar} />
                <div>
                  <strong>{item.author}</strong>
                  <span>{item.role}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.finalCta}>
        <div className={styles.ctaCopy}>
          <span className={styles.kicker}>Ready to take control?</span>
          <h3>Ready to take control of your inventory and shipping?</h3>
          <Link href="/login" className={styles.primaryButtonLarge}>
            Get Started For Free
          </Link>
        </div>

        <div className={styles.ctaStats}>
          <span className={styles.eyebrow}>Total customers</span>
          <strong>1,842</strong>
          <div className={styles.ctaMeta}>
            <span>Live inventory updates</span>
            <span>24/7 support</span>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <div className={styles.brandMarkSmall}>
            <span className={styles.tileA} />
            <span className={styles.tileB} />
            <span className={styles.tileC} />
            <span className={styles.tileD} />
          </div>
          <span className={styles.brandText}>Fastship</span>
        </div>

        <div className={styles.footerColumns}>
          <div>
            <h5>Product</h5>
            <a href="#">Inventory</a>
            <a href="#">Orders</a>
            <a href="#">Shipments</a>
          </div>
          <div>
            <h5>Company</h5>
            <a href="#">About us</a>
            <a href="#">Careers</a>
            <a href="#">Blog</a>
          </div>
          <div>
            <h5>Resources</h5>
            <a href="#">Support</a>
            <a href="#">Documentation</a>
            <a href="#">Privacy</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
