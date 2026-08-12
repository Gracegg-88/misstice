import Header from "@/components/Header";
import Footer from "@/components/Footer";

export type TocItem = { id: string; label: string };

export default function GuideLayout({
  heroImage,
  heroAlt,
  title,
  subtitle,
  toc,
  children,
}: {
  heroImage: string;
  heroAlt: string;
  title: string;
  subtitle?: string;
  toc: TocItem[];
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="bg-cream">
        <section className="relative overflow-hidden px-5 pb-8 pt-12 sm:px-8 sm:pb-10 sm:pt-16">
          <div aria-hidden="true" className="absolute right-[8%] top-0 h-72 w-72 rounded-full bg-festif/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-content gap-8 lg:grid-cols-[1fr_.38fr] lg:items-end">
            <div className="max-w-4xl">
              <p className="font-label text-[10px] font-medium uppercase tracking-[0.16em] text-violet">Guide Misstice · à garder sous la main</p>
              <h1 className="mt-4 max-w-[15ch] font-display text-4xl font-semibold leading-[.93] tracking-tight text-plum sm:text-5xl lg:text-6xl">{title}</h1>
              {subtitle && <p className="mt-5 max-w-2xl text-base font-light leading-relaxed text-slate sm:text-lg">{subtitle}</p>}
            </div>
            <div className="bg-ink p-5 text-cream">
              <p className="font-label text-[10px] uppercase tracking-[0.14em] text-festif">Dans ce guide</p>
              <p className="mt-3 font-display text-2xl font-semibold leading-none">Des repères concrets, puis la liberté de les adapter.</p>
              <p className="mt-4 text-sm font-light leading-relaxed text-cream/75">Budget, étapes, idées et prestataires : allez directement à ce qui vous aide maintenant.</p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-content px-5 py-10 sm:px-8 sm:py-14">
          {/* Sommaire mobile, replié par défaut. La version desktop (sticky) est plus bas. */}
          <details className="mt-2 bg-white/60 p-4 lg:hidden">
            <summary className="cursor-pointer list-none font-label text-xs uppercase tracking-[0.1em] text-plum marker:hidden">
              Sommaire
            </summary>
            <nav className="mt-3 flex flex-col gap-1">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="px-2 py-1.5 text-sm text-slate hover:text-violet"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </details>

          <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-14">
            <aside className="hidden lg:block">
              <nav className="sticky top-28 flex flex-col gap-1 pl-1">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="py-1.5 text-sm font-medium text-slate transition-colors hover:text-violet"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </aside>

            <div className="min-w-0 space-y-14">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
