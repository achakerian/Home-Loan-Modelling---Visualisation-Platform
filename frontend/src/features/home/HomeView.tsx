const HomeView = () => {
  const cards = Array.from({ length: 6 }).map((_, index) => ({
    id: index + 1,
    title: `Mobile-first calculators #${index + 1}`,
    body:
      'Explore repayments, borrowing power, pay and super with responsive views that surface the essentials and keep charts touch-friendly.'
  }));

  return (
    <section className="space-y-4 pb-24">
      {cards.map((card) => (
        <article key={card.id} className="rounded-3xl bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Update</p>
          <h2 className="mt-1 text-lg font-semibold text-secondary">{card.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{card.body}</p>
        </article>
      ))}
    </section>
  );
};

export default HomeView;
