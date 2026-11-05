import { Suspense } from "react";
import { LoginButton } from "./login-button";

async function LoginError({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  if (!erro) return null;

  return (
    <p role="alert" className="text-center text-sm text-danger">
      {erro === "token"
        ? "O Google não liberou o acesso contínuo à agenda. Entre de novo e aceite todas as permissões."
        : "Não foi possível entrar. Tente de novo."}
    </p>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col items-center justify-center gap-10 px-8 [padding-left:max(2rem,env(safe-area-inset-left))] [padding-right:max(2rem,env(safe-area-inset-right))]">
      <div className="flex flex-col items-center gap-5 text-center">
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
        <p className="max-w-[280px] leading-relaxed text-text-2">
          O que você precisa falar em cada reunião, anotado antes de entrar nela.
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-3">
        <Suspense>
          <LoginError searchParams={searchParams} />
        </Suspense>
        <LoginButton />
        <p className="text-center text-[13px] leading-relaxed text-text-2">
          O app só lê a sua agenda. Nunca cria nem altera eventos.
        </p>
      </div>
    </main>
  );
}
