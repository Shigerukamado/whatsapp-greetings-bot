import {Link} from "react-router-dom";
import WhatsAppPreview from "../Components/WhatsAppPreview.jsx";
import "./Landing.css";

const STEPS = [
  {
    n: "1",
    title: "Add your people",
    body: "Upload a CSV or add contacts one by one — name, birthday, WhatsApp number, and which group they belong to.",
  },
  {
    n: "2",
    title: "The bot watches the calendar",
    body: "Every morning it checks who's celebrating today, in your timezone, and skips anyone it's already greeted.",
  },
  {
    n: "3",
    title: "The message goes out",
    body: "A greeting lands in their WhatsApp automatically — no one has to remember, type, or hit send.",
  },
];

const FEATURES = [
  {
    title: "No duplicate greetings",
    body: "Once someone's been wished a happy birthday this year, the bot won't do it twice — even if you re-run the job.",
  },
  {
    title: "Group-aware",
    body: "Family, Workers, Business Partners, Customers — filter who gets which greeting, and keep tones separate between groups.",
  },
  {
    title: "Set to your timezone",
    body: "Runs on Africa/Lagos time by default, so messages land in the morning, not at 3am.",
  },
  {
    title: "Holidays too",
    body: "Public holidays and observances go out the same way birthdays do, on the dates you set.",
  },
];

function Landing() {
    return (
        <div className="landing">
          <header className="nav">
             <div className="nav-brand">
               <img src="/kaabo_logo_concept.png" alt="Kaabo Logo" className="nav-logo" />
               <span className="nav-mark">Kaabo</span>
             </div>
            <nav className="nav-links">
              <Link to="/login" className="btn btn-ghost">
                Sign in
              </Link>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
              </nav>
          </header>

          <section className="hero">
            <div className="hero-text">
              <h1>
                Every birthday,
                <br />
                holiday, 
                <br/>
                remembered,
                <br/>
                on WhatsApp.
              </h1>
              <p className="hero-subtext">
                 Add your people once. Kaabo checks the calendar every morning and
                 sends the greeting — on WhatsApp, in the right group, without you
                 lifting a finger.
              </p>
              <p className="hero-incentive">Free For the First Month</p>
                <div className="hero-actions">
                  <Link to="/register" className="btn btn-primary">
                  Create your Calendar
                  </Link>
                  <Link to="/login" className="btn btn-ghost">
                  I already have an account
                  </Link>
                </div>
            </div>

            <div className="hero-visual">
              <WhatsAppPreview/>
            </div>
          </section>

          <section className="steps">
            <h2>How It Works</h2>
            <div className="steps-grid">
              {STEPS.map((s) => (
                <div className="step" key={s.n}>
                  <span className="step-n">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
            </section>

            <section className="features">
              <h2>Built for You and your Company</h2>
              <div className="features-grid">
                {FEATURES.map((f) => (
                  <div className="feature" key={f.title}>
                    <h3>{f.title}</h3>
                    <p>{f.body}</p>
                  </div>
                ))}
              </div>
            </section>
            
            <section className="cta-band">
              <h2>Stop settings reminders and let Kaabo remember for you</h2>
              <Link to="/register" className="btn btn-primary">
            Get Started - It's free for the first Month
              </Link>

             <form className="newsletter">
              <input
              type="email"
              placeholder="Enter your email"
              className="newsletter-input"
              required
              />
              <button type="submit" className="btn btn-primary">
                Subscribe
                </button>
                </form>
                </section>
            <footer className="footer">
              <span>Kaabo</span>
              <span> Remember so you won't forget</span>
              <span>&copy; 2026 Kaabo. All rights reserved.</span>
            </footer>
        </div>
    )
}

export default Landing;