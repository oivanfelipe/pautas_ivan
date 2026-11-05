import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

// Placeholder da Agenda (etapa 5). Por enquanto confirma que o login funcionou.
async function Session() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <h1 className="text-xl font-semibold">Você está dentro</h1>
      <p className="text-text-2">
        Conectado como <span className="text-text">{user?.email}</span>. A Agenda chega na
        próxima etapa.
      </p>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="h-11 rounded-full border border-border px-5 text-sm font-medium"
        >
          Sair
        </button>
      </form>
    </>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
      <Suspense fallback={<p className="text-text-2">Carregando…</p>}>
        <Session />
      </Suspense>
    </main>
  );
}
