import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

async function Account() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[13px] font-semibold text-text-2">Conta</span>
      <span>{user?.email}</span>
    </div>
  );
}

// Versão mínima (etapa 10 traz tema e sincronizar agora): conta e sair.
export default function Configuracoes() {
  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-6 px-4 pt-3">
      <Link href="/" className="flex h-11 w-fit items-center text-sm font-medium text-accent">
        ← Voltar para a Agenda
      </Link>
      <h1 className="text-xl font-semibold">Configurações</h1>
      <Suspense fallback={<span className="text-text-2">Carregando…</span>}>
        <Account />
      </Suspense>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="h-11 rounded-full border border-border px-5 text-sm font-medium"
        >
          Sair
        </button>
      </form>
    </main>
  );
}
