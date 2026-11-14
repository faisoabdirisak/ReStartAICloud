import {
  ArrowRight,
  Compass,
  Eye,
  GraduationCap,
  Handshake,
  ListChecks,
  ScanSearch,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';

const card =
  'rounded-2xl border border-border-light bg-surface-light p-5 shadow-sm hover:border-primary/35 hover:shadow-lg dark:border-border-dark dark:bg-surface-dark dark:hover:border-primary/40 motion-safe:transition motion-safe:duration-200 motion-safe:hover:-translate-y-1 sm:p-6';

const purpose = [
  {
    icon: Target,
    title: 'Our mission',
    copy: 'Help people facing a career transition find a realistic next step. ReStart turns their skills, goals, available time, and budget into options they can compare and a plan they can begin.',
  },
  {
    icon: Eye,
    title: 'Our vision',
    copy: 'Make career transition support easier to access, especially for people with limited time, money, or access to career guidance. We envision workers and advisers using a shared plan to make informed decisions together.',
  },
];

const journey = [
  {
    icon: Compass,
    title: 'Explore and compare',
    copy: 'Enter a profile to receive three ranked opportunities across career changes, upskilling, or small business ideas. Compare two options by fit, estimated cost, launch time, and first task. Open the explanation to see the factors behind the score.',
  },
  {
    icon: ListChecks,
    title: 'Choose and act',
    copy: 'Focus on an opportunity and follow its 30-day plan. Adjust the guidance for unfinished tasks when your budget or weekly hours change. My Next Step on the Dashboard shows the first unfinished task and opens it in the plan.',
  },
  {
    icon: Handshake,
    title: 'Discuss your plan',
    copy: 'Preview, print, or save an adviser handoff with your chosen opportunity, estimated costs and risks, progress, and questions to discuss.',
  },
];

const stakeholders = [
  {
    icon: Users,
    title: 'Workers and job seekers',
    copy: 'People affected by job loss, changing industries, or returning to work can explore how their existing skills might transfer. They can choose a path based on their circumstances and take it one task at a time.',
  },
  {
    icon: Handshake,
    title: 'Career advisers and workforce teams',
    copy: 'Advisers and outplacement teams can use the handoff report to discuss trade-offs, check local requirements, and identify support such as training or a referral.',
  },
  {
    icon: GraduationCap,
    title: 'Lecturers and reviewers',
    copy: 'Lecturers can try a fictional profile or run a live analysis, review a plan, and publish feedback with consent. The Evaluation page shows what reviewers found useful and where they got stuck.',
  },
];

export function AboutPage({ onTryDemo }: { onTryDemo: () => void }) {
  return (
    <div aria-labelledby="about-heading" className="space-y-10 text-app">
      <header
        className={`${card} border-primary/20 bg-gradient-to-br from-primary/10 to-surface-light dark:to-surface-dark`}
      >
        <p className="text-sm font-medium text-primary">IBM AI Challenge project</p>
        <h1 id="about-heading" className="mt-2 text-3xl font-bold">
          About ReStart AI Cloud
        </h1>
        <p className="mt-3 max-w-3xl leading-relaxed text-muted">
          A career change can mean sorting through unfamiliar jobs, training costs, and conflicting
          advice. ReStart AI Cloud gives workers a place to compare their options, choose a
          direction, and turn that decision into a practical 30-day plan they can discuss with an
          adviser.
        </p>
        <button
          type="button"
          onClick={onTryDemo}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Try the guest demo <ArrowRight size={16} aria-hidden="true" />
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {purpose.map(({ icon: Icon, title, copy }) => (
          <article key={title} className={card}>
            <span className="mb-3 inline-flex rounded-xl bg-primary/10 p-2.5 text-primary">
              <Icon size={22} aria-hidden="true" />
            </span>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{copy}</p>
          </article>
        ))}
      </div>

      <section aria-labelledby="about-journey">
        <h2 id="about-journey" className="mb-4 text-xl font-bold">
          How it works
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {journey.map(({ icon: Icon, title, copy }) => (
            <article key={title} className={card}>
              <span className="mb-3 inline-flex rounded-xl bg-primary/10 p-2.5 text-primary">
                <Icon size={22} aria-hidden="true" />
              </span>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="about-stakeholders">
        <h2 id="about-stakeholders" className="mb-4 text-xl font-bold">
          Who it serves
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {stakeholders.map(({ icon: Icon, title, copy }) => (
            <article key={title} className={card}>
              <span className="mb-3 inline-flex rounded-xl bg-primary/10 p-2.5 text-primary">
                <Icon size={22} aria-hidden="true" />
              </span>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <article className={card}>
          <span className="mb-3 inline-flex rounded-xl bg-primary/10 p-2.5 text-primary">
            <ScanSearch size={22} aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold">How AI supports the decision</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            The AI model suggests opportunities, plan tasks, and fit factors. The app calculates each
            score using fixed weights for skill fit, affordability, launch speed, and simplicity.
            Workers choose which plan to focus on. Check cost estimates and local requirements
            before spending money or applying.
          </p>
        </article>
        <article className={card}>
          <span className="mb-3 inline-flex rounded-xl bg-primary/10 p-2.5 text-primary">
            <ShieldCheck size={22} aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold">Guest access and project background</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Explore fictional profiles in the guest demo or submit a non-sensitive profile for live
            recommendations. Live plans and progress are saved for the same browser. Faiso developed
            ReStart AI Cloud for the IBM AI Challenge, with IBM Bob helping build and debug the app.
          </p>
        </article>
      </div>
    </div>
  );
}
