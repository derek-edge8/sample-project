import { toSource } from "@/lib/crm";
import { InquiryForm } from "./inquiry-form";

export default async function Home({ searchParams }: PageProps<"/">) {
  // The operator logs email/phone inquiries through /?source=email or /?source=phone.
  const source = toSource((await searchParams).source);

  return (
    <main className="flex-1">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 sm:px-6">
        <span className="text-lg font-semibold tracking-tight">sample-project</span>
        <a href="#ask" className="btn-quiet">Ask a question</a>
      </header>

      <section className="mx-auto max-w-3xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
          The right backpack.
          <br />
          <span className="text-muted">Not just any backpack.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-xl leading-relaxed text-muted">
          Tell us your laptop and how you carry. We&apos;ll tell you which bag fits, what it&apos;s made of,
          and which size is right. Usually within a day.
        </p>
        <a href="#ask" className="btn mt-10">Ask about a bag</a>
      </section>

      <section className="bg-panel">
        <div className="mx-auto grid max-w-5xl gap-4 px-4 py-16 sm:grid-cols-3 sm:px-6">
          {[
            ["Sizing", "Torso length, capacity, and how it carries when it's full."],
            ["Materials", "What it's made of, how it wears, and how it handles rain."],
            ["Laptop fit", "Tell us your laptop. We'll tell you if it fits, and how snugly."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl bg-bg p-6">
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="ask" className="mx-auto max-w-2xl scroll-mt-8 px-4 py-20 sm:px-6">
        <h2 className="text-center text-4xl font-semibold tracking-tight">Ask us anything.</h2>
        <p className="mt-3 text-center text-lg text-muted">A real person reads every question.</p>
        <div className="mt-10">
          <InquiryForm source={source} />
        </div>
      </section>

      <footer className="border-t border-line">
        <p className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted sm:px-6">© sample-project</p>
      </footer>
    </main>
  );
}
