export default function GuideSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-plum sm:text-3xl">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
