# PRD — Documento de Requisitos do Produto

## Resumo do app
Pautas é um app pessoal, mobile-first, que lê a agenda Google da semana e cria uma pauta vazia para cada reunião com outras pessoas, onde o Ivan anota o que precisa falar e marca um checklist durante a reunião.

## Problema que resolve
Hoje o Ivan chega nas reuniões sem ter registrado, em um lugar único, o que precisa falar em cada uma (ex.: "daily do dia 4: falar X, Y, Z"). As anotações ficam espalhadas ou na memória. A agenda mostra o horário, mas não tem espaço estruturado para a pauta, e não há checklist para acompanhar o que já foi dito durante a reunião.

## Público-alvo
- **Usuário único: o próprio Ivan** (profissional de marketing de performance, com muitas reuniões por semana, usando o celular na maior parte do tempo).
- Não há segundo perfil (sem administrador, sem time, sem compartilhamento de pautas).

## Funcionalidades da primeira versão

1. **Login com Google** — entra com a conta Google e autoriza leitura da Agenda (somente leitura).
2. **Sincronização da semana** — busca os próximos 7 dias da agenda principal e cria uma pauta vazia por reunião. Só entram eventos com outros participantes; ficam de fora eventos sem convidados, de dia inteiro e os recusados. Roda ao abrir o app, ao puxar para atualizar e uma vez por dia.
3. **Tela Semana** — lista as reuniões agrupadas por dia, com horário, título e progresso do checklist (ex.: 3/5). Hoje aparece destacado e a reunião em andamento ganha atalho.
4. **Pauta da reunião** — anotações livres e checklist, com salvamento automático.
5. **Checklist básico** — adicionar, marcar, desmarcar e apagar itens.
6. **Reordenar itens** — arrastar para definir a ordem em que os assuntos serão falados.
7. **Copiar pendências da reunião anterior** — em reuniões recorrentes (ex.: Daily), os itens não marcados da ocorrência anterior podem ser trazidos para a nova pauta.
8. **Modelo de pauta por reunião recorrente** — o Ivan define itens fixos para uma série (ex.: Daily) e toda nova ocorrência já nasce com eles.
9. **Modo Reunião** — tela limpa para uso durante a reunião: checklist grande, marcar com um toque, tela sempre ligada.
10. **Funciona sem sinal** — a última semana fica disponível offline e as edições feitas sem conexão sobem quando o sinal voltar.
11. **Instalável no celular (PWA)** — abre da tela inicial como um app.

## Fora do escopo da primeira versão
- Criar, editar ou excluir eventos na agenda Google.
- Mais de uma agenda (só a principal).
- Layout de desktop com duas colunas e atalhos de teclado (fase seguinte).
- Sobreposição sobre a reunião (Picture-in-Picture no Chrome desktop).
- Notificações e lembretes ("reunião em 10 minutos").
- Pauta gerada por IA, resumo ou transcrição da reunião.
- Compartilhar pautas ou usar com outras pessoas.

## Critério de sucesso
A primeira versão está pronta quando o Ivan usa o app durante **uma semana real de reuniões (5 dias úteis)** sem precisar anotar nada fora dele: toda reunião com outras pessoas teve a pauta preenchida no app, o checklist foi usado durante a reunião e nenhum dado foi perdido, inclusive quando estava sem sinal.

## Pendências
- Nenhuma neste documento. Pergunta aberta para o TRD: publicar o OAuth do Google como *In production*, para evitar que o login expire a cada 7 dias.
