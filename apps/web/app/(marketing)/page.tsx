import type { Metadata } from "next";
import { PricingTable } from "@/components/pricing-table";

export const metadata: Metadata = {
  title: "Test Marks & Progress Report App for Schools and Tuition Centres",
};

const PROBLEMS = [
  "Marks go into a register and are never seen again.",
  "A parent asks ‘is my child improving?’ and nobody can show them.",
  "Weak chapters are found at the annual exam — too late for a remedial class.",
];

const STEPS = [
  { title: "Add your students", body: "Type them in or upload an Excel/CSV file." },
  { title: "Enter marks after every chapter test", body: "On a phone, in about 3 minutes." },
  { title: "Share and act", body: "Send report cards to parents on WhatsApp and see who needs a remedial class today." },
];

const REPLACES: Array<[string, string]> = [
  ["Marks in a register that gets lost or thrown away", "Every mark of every student and every test, kept and searchable"],
  ["Teacher adds totals, averages and ranks by hand", "Calculated the moment marks are saved"],
  ["Report cards written or printed by hand", "A branded WhatsApp report card in one tap, no printing"],
  ["Weak chapters found at the annual exam", "Weak students and chapters visible the day after the test"],
  ["“Is my child improving?” has no answer", "A trend line for every student in every subject"],
];

const FAQS: Array<[string, string]> = [
  ["Is it really free?", "Yes, up to 50 active students, with no time limit and no card."],
  ["Why is it so cheap?", "We do one job: keep marks and show progress. No ads, and we never sell your data."],
  ["What happens above 50 students?", "Everything you already entered stays. To add more students, you pick a plan."],
  ["Do I need to install anything?", "No. It works in the browser on any phone or computer."],
  ["Who can see my data?", "Only the logins you create. Each school sees only its own data."],
  ["Can I cancel?", "Yes, any time from Settings or from PhonePe AutoPay. Your data stays safe and readable."],
  ["Can teachers use it?", "Yes. You get a teacher login that can enter marks but not delete anything."],
];

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-white px-6 py-20 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Every test mark, kept.
          <br />
          Every student&rsquo;s progress, visible.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--muted)]">
          MarksKhata is the digital khata for school and tuition test marks. Enter marks in about 3
          minutes. Get a class report, a parent report card on WhatsApp and each student&rsquo;s
          progress for the whole year.
        </p>
        <p className="mt-4 text-lg font-semibold text-[var(--brand)]">
          Free for 50 students. After that, about ₹1 per student per month.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="/signup"
            className="rounded-lg bg-[var(--brand)] px-6 py-3 font-semibold text-white hover:bg-[var(--brand-dark)]"
          >
            Start free
          </a>
          <a
            href="#pricing"
            className="rounded-lg border border-black/15 px-6 py-3 font-semibold hover:bg-black/5"
          >
            See pricing
          </a>
        </div>
        <p className="mt-6 text-sm text-[var(--muted)]">
          Built at Aveti Learning tuition centre, Bhubaneswar · Each school sees only its own data ·
          No card needed
        </p>
      </section>

      {/* The problem */}
      <section className="px-6 py-16">
        <h2 className="mx-auto max-w-2xl text-center text-2xl font-bold sm:text-3xl">
          You would never forget a rupee owed. Why forget a mark earned?
        </h2>
        <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-3">
          {PROBLEMS.map((text) => (
            <div key={text} className="rounded-xl border border-black/10 bg-white p-5">
              <p className="text-sm text-[var(--ink)]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white px-6 py-16">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">How it works</h2>
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="text-center">
              <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)] font-semibold text-white">
                {index + 1}
              </div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What ₹1 replaces */}
      <section className="px-6 py-16">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">What ₹1 replaces</h2>
        <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-xl border border-black/10 bg-white">
          {REPLACES.map(([before, after], index) => (
            <div
              key={before}
              className={`grid gap-4 p-4 sm:grid-cols-2 ${index !== 0 ? "border-t border-black/10" : ""}`}
            >
              <p className="text-sm text-[var(--muted)] line-through decoration-black/20">{before}</p>
              <p className="text-sm font-medium text-[var(--brand-dark)]">{after}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-white px-6 py-16">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">The price, in rupees per student</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[var(--muted)]">
          About ₹1 per student per month, when your plan is full.
        </p>
        <div className="mt-10">
          <PricingTable />
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">Questions</h2>
        <div className="mx-auto mt-8 max-w-2xl divide-y divide-black/10">
          {FAQS.map(([question, answer]) => (
            <details key={question} className="group py-4">
              <summary className="cursor-pointer list-none font-medium marker:content-none">
                {question}
              </summary>
              <p className="mt-2 text-sm text-[var(--muted)]">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[var(--brand)] px-6 py-16 text-center text-white">
        <h2 className="text-2xl font-bold sm:text-3xl">
          Start keeping your marks today. Your first 50 students are free.
        </h2>
        <a
          href="/signup"
          className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-[var(--brand-dark)] hover:bg-white/90"
        >
          Start free
        </a>
      </section>

      <footer className="px-6 py-10 text-center text-sm text-[var(--muted)]">
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <a href="#pricing" className="hover:underline">Pricing</a>
          <a href="/terms" className="hover:underline">Terms of Service</a>
          <a href="/privacy" className="hover:underline">Privacy Policy</a>
          <a href="/refunds" className="hover:underline">Refund &amp; Cancellation Policy</a>
          <a href="/contact" className="hover:underline">Contact Us</a>
        </nav>
        <p className="mt-4">© {new Date().getFullYear()} MarksKhata</p>
      </footer>
    </main>
  );
}
