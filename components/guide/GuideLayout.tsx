import Header from "@/components/Header";
import Footer from "@/components/Footer";

export type TocItem = { id: string; label: string };

export default function GuideLayout({
  heroImage,
  heroAlt,
  title,
  toc,
  children,
}: {
  heroImage: string;
  heroAlt: string;
  title: string;
  toc: TocItem[];
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="bg-cream">
        <div className="relative h-56 w-full overflow-hidden sm:h-72">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt={heroAlt}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-plum/60 via-plum/10 to-transparent" />
        </div>

        <div className="mx-auto max-w-content px-5 py-10 sm:px-8 sm:py-14">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum sm:text-4xl">
            {title}
          </h1>

          {/* Sommaire mobile, replié par défaut. La version desktop (sticky) est plus bas. */}
          <details className="mt-6 rounded-2xl border border-black/5 bg-white p-4 shadow-sm lg:hidden">
            <summary className="cursor-pointer list-none font-semibold text-plum marker:hidden">
              Sommaire
            </summary>
            <nav className="mt-3 flex flex-col gap-1">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="rounded-lg px-2 py-1.5 text-sm text-slate hover:bg-violet-soft hover:text-violet"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </details>

          <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-14">
            <aside className="hidden lg:block">
              <nav className="sticky top-28 flex flex-col gap-1 border-l border-black/10 pl-4">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="rounded-r-lg py-1.5 pl-3 text-sm font-medium text-slate transition-colors hover:text-violet"
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
