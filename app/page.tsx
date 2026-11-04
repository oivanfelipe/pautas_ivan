export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
      <div
        aria-hidden="true"
        className="flex h-[72px] w-[72px] items-center justify-center rounded-[18px] bg-accent"
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-on-accent"
        >
          <path d="M5 12l5 5 9-10" />
        </svg>
      </div>
      <h1 className="text-[28px] font-semibold">Pautas</h1>
      <p className="max-w-[280px] text-text-2">
        O que você precisa falar em cada reunião, anotado antes de entrar nela.
      </p>
    </main>
  );
}
