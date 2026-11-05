# Plano de Implementação

> Decisão do Ivan: testar no celular **só ao final do MVP**. Modo Reunião e offline entram **no MVP** (como no PRD). Por isso as etapas abaixo são internas, validadas por testes automáticos e por mim no navegador, e o Ivan recebe uma única entrega para testar.

## Sequência de construção

1. **Fundação do projeto** — Next.js + TypeScript + Tailwind, tokens de cor claro/escuro do Design Brief, fonte Inter, estrutura de pastas, deploy vazio na Vercel (`pautas-ivan.vercel.app`) e variáveis de ambiente. *Vem primeiro porque tudo depende de um app que roda e publica.*
2. **Banco** — migração `supabase/migrations/` com as 4 tabelas `pautas_*`, índices e RLS do Esquema de Backend. Teste de RLS com dois usuários distintos. *Antes do login e do sync porque ambos gravam aqui.*
3. **Login com Google** — Supabase Auth, escopo `calendar.readonly`, `access_type=offline`, `/auth/callback` capturando e criptografando o refresh token, sessão persistente, sair. *Depende do banco (tabela de contas) e destrava tudo que é autenticado.*
4. **Sync da agenda** — `/api/sync` com filtro (só reuniões com outras pessoas, com horário, não recusadas), upsert por `google_event_id`, cancelados preservados, recebe o intervalo visível, cron diário. Pauta nova nasce com os itens do modelo. *Depende do login (token) e do banco.*
5. **Agenda (Dia / Semana / Mês)** — lista e grade, navegação por período, "Hoje", destaque da reunião em andamento, puxar para atualizar, estados vazio/carregando/erro. *Depende dos dados sincronizados.*
6. **Pauta** — cabeçalho, anotações com salvamento automático, checklist (adicionar, marcar, apagar, reordenar com ids e posições do cliente). *Depende da Agenda para abrir uma reunião.*
7. **Recorrentes** — "Trazer pendências da anterior" e "Modelo da série" por `title_key`. *Depende da Pauta e do checklist.*
8. **Modo Reunião** — tela limpa com itens grandes, check em um toque, itens marcados descem, notas rápidas, tela sempre ligada (Wake Lock), botão manual de entrada e saída. *Depende do checklist.*
9. **Offline e PWA** — service worker, cache da agenda e das pautas em IndexedDB, fila de edições com resolução por `updated_at`, faixa "Offline", selo "Aguardando conexão", manifest e ícone instalável. *Por último porque cobre as telas anteriores; construir antes forçaria refazer.*
10. **Acabamento e entrega** — Configurações (tema, sincronizar agora, sair), reconexão do Google, revisão de acessibilidade (contraste, áreas de toque) e entrega ao Ivan para a semana de teste real.

## Marcos de validação
Como o Ivan só testa no final, cada marco abaixo é verificado por mim antes de seguir.

| Após a etapa | Verificação |
|---|---|
| 2 | Dois usuários de teste: cada um só vê os próprios dados; `pautas_google_accounts` inacessível pelo cliente |
| 3 | Login completo no navegador; token gravado criptografado (nunca em texto legível) |
| 4 | Sync com a agenda real do Ivan: eventos sem convidados, de dia inteiro e recusados ficam de fora; rodar duas vezes não duplica nem apaga anotações |
| 6 | Escrever, fechar e reabrir: nada se perde; reordenar mantém a ordem após recarregar |
| 7 | Daily de hoje recebe as pendências de ontem sem duplicar; modelo aplicado só a pautas novas |
| 9 | Modo avião: abrir o app, editar a pauta e marcar itens; ao voltar a rede tudo sobe e prevalece a edição mais recente |
| 10 | Checagem final de ponta a ponta no celular simulado e no PWA instalado, nos dois temas |

**Teste do Ivan (único):** uma semana real de reuniões (5 dias úteis). Está pronto quando ele não precisou anotar nada fora do app e nada foi perdido, inclusive sem sinal (critério do PRD).

## Riscos e dependências

| Risco ou dependência | Efeito | O que fazer |
|---|---|---|
| Credencial OAuth no Google Cloud ainda não criada | Bloqueia as etapas 3 a 10 | Eu passo o passo a passo; o Ivan cria e coloca `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no cofre da Vercel (não no chat) |
| App OAuth precisa estar *In production* | Em *Testing* o acesso expira em 7 dias e o sync para | Publicar ao criar a credencial (decisão já tomada no TRD) |
| Aviso "app não verificado" do Google | Susto no primeiro login | Documentado no AppFlow; é esperado em uso pessoal |
| Banco compartilhado com outros apps (`task-chat`) | Risco de colisão de nomes e de afetar outros apps | Prefixo `pautas_`; migração só aditiva; nenhuma tabela existente é alterada |
| RLS desligado em `settings` e `daily_items` (não são do Pautas) | Exposição no projeto, fora do escopo | Decisão pendente do Ivan; não mexo sem pedido |
| Offline com fila de edições (etapa 9) | É a parte mais propensa a bugs sutis | Construída por último, com testes de conflito; tratada como marco próprio |
| Sem teste intermediário no celular | Um problema de usabilidade só aparece no fim | Mitigação: revisão visual em tela de celular a cada etapa de interface e prévia de telas aprovada antes de construir |
| Sobreposição sobre a reunião e desktop em duas colunas | Fora do MVP | Entram em fases posteriores, depois da semana de teste |

## Interpretações minhas
- À pergunta "Modo Reunião e offline junto do MVP?", o Ivan respondeu "pode". Entendi como: manter no MVP, como no PRD. Se a intenção era fazer um primeiro marco só com Agenda e Pauta, as etapas 8 e 9 viram uma segunda entrega.
