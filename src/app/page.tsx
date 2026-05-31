import Link from "next/link";

const STEPS = [
  {
    title: "Tell us about you",
    body: "Budget, how you'll use the car, who's riding along, and what matters most. Six quick questions.",
  },
  {
    title: "We score the catalog",
    body: "A weighted engine ranks every car against your needs — not an alphabetical list of 500 models.",
  },
  {
    title: "Get an explained shortlist",
    body: "Five or six strong matches, each with a match score and a plain-English why-it-fits and trade-offs.",
  },
];

export default function Home() {
  return (
    <div className="hero-gradient">
      <section className="mx-auto max-w-6xl px-5 pt-20 pb-16 text-center">
        <p className="inline-block rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          From “I don’t know what to buy” → “I’m confident about my shortlist”
        </p>
        <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
          Stop scrolling 500 cars.
          <br />
          <span className="text-indigo-600">Answer 6 questions instead.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          CarMatch takes how you actually live and drive, scores the whole catalog on the things
          you care about, and hands you a tight, explained shortlist you can act on.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/find"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            Find my car
          </Link>
          <a
            href="#how"
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            How it works
          </a>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-5 pb-24">
        <div className="grid gap-5 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                {i + 1}
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
