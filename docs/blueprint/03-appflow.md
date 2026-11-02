# AppFlow — Fluxo e Navegação do App

## Mapa de telas

- **Login** — botão "Entrar com Google"; pede acesso de leitura à Agenda.
- **Agenda** — tela inicial. Reuniões em três visões alternáveis: Dia, Semana (padrão) e Mês. Navega para frente e para trás no tempo e volta para "Hoje".
- **Pauta da reunião** — cabeçalho da reunião, checklist e anotações livres, com salvamento automático.
- **Modo Reunião** — tela limpa para usar durante a reunião: checklist grande e anotações rápidas.
- **Modelo da série** — itens fixos de uma reunião recorrente (ex.: Daily). Abre a partir da Pauta.
- **Configurações** — conta conectada, sincronizar agora, sair.

Navegação principal: a Agenda é a raiz. A Pauta abre por cima da Agenda, e o Modo Reunião abre por cima da Pauta. Configurações abre pelo ícone no topo da Agenda. Sem barra de abas inferior: o app tem poucas telas e a barra tiraria espaço da lista.

## Jornada principal
Preparar e usar a pauta de uma reunião.

1. Usuário abre o app → cai na **Agenda** na visão **Semana**, rolada até hoje → o app sincroniza em segundo plano (indicador discreto no topo).
2. Vê as reuniões da semana agrupadas por dia → toca em uma reunião → abre a **Pauta**.
3. Na **Pauta**, toca em "Adicionar item", digita e confirma com Enter → o item entra no checklist (repete quantas vezes precisar). Reordena arrastando a alça do item. Escreve observações no campo de **Anotações**.
4. Volta para a **Agenda** pelo botão de voltar → o cartão da reunião mostra o progresso (ex.: 0/4).
5. Na hora da reunião, abre a **Pauta** (ou toca no atalho da reunião em andamento na Agenda) → toca no botão **Modo Reunião**.
6. No **Modo Reunião**, toca em cada item ao falar dele → o item é marcado e desce para o fim da lista. Pode anotar algo rápido no campo de notas.
7. Ao terminar, toca em "Sair" no topo → volta à **Pauta** com o checklist atualizado.

## Jornadas alternativas

- **Trocar a visão da Agenda.** No topo da Agenda há o seletor Dia / Semana / Mês. Em Dia, mostra as reuniões do dia em ordem de horário. Em Semana, mostra os 7 dias em lista vertical, agrupados por dia. Em Mês, mostra a grade do mês com um ponto nos dias que têm reunião; tocar num dia leva para a visão Dia daquela data. Setas navegam para o período anterior e o próximo, e "Hoje" volta ao período atual.
- **Primeiro acesso (login).** Login → tela de consentimento do Google (aviso "app não verificado" → Avançado → Continuar) → volta para a Agenda e faz a primeira sincronização.
- **Reunião recorrente, copiar pendências.** Na Pauta de uma reunião que faz parte de uma série, aparece o botão "Trazer pendências da anterior" → copia para a pauta atual os itens não marcados da ocorrência anterior. Itens já existentes não são duplicados.
- **Reunião recorrente, modelo da série.** Na Pauta, "Modelo da série" → o usuário define itens fixos → toda ocorrência futura já nasce com esses itens. Ocorrências que já existem não são alteradas.
- **Atualizar a agenda manualmente.** Puxar a lista para baixo na Agenda, ou "Sincronizar agora" nas Configurações.
- **Reunião cancelada ou removida na agenda Google.** A reunião continua na lista com o selo "Cancelada", e a pauta fica preservada.
- **Reunião que mudou de horário.** A Pauta é mantida e o horário é atualizado no próximo sync.
- **Sair da conta.** Configurações → Sair → volta ao Login. Os dados locais do aparelho são apagados.
- **Sessão do Google expirada ou acesso revogado.** Aviso na Agenda "Reconecte sua conta Google" com botão que leva ao Login. As pautas já salvas continuam visíveis.

## Estados especiais

| Situação | O que a tela mostra |
|---|---|
| Agenda sem reuniões no período | Mensagem "Nenhuma reunião com outras pessoas neste período" e botão "Hoje" |
| Primeira sincronização em andamento | Esqueleto de cartões e texto "Buscando sua agenda…" |
| Sincronizando em segundo plano | Indicador discreto no topo; a lista continua utilizável |
| Falha ao sincronizar (rede ou Google) | Faixa "Não foi possível atualizar. Mostrando dados salvos" com botão "Tentar de novo" |
| Sem internet | Faixa "Offline" fixa; leitura e edição funcionam normalmente; edições entram na fila |
| Edições pendentes de envio | Selo "Aguardando conexão" na Pauta; some quando sobem |
| Pauta nova, sem itens nem notas | Campo de item em foco e dica "Escreva o que você precisa falar nesta reunião" |
| Todos os itens marcados | Resumo "Tudo falado" no topo do checklist; itens marcados continuam visíveis no fim |
| Reunião em andamento | Cartão destacado na Agenda com o atalho "Modo Reunião" |
| Reunião cancelada | Selo "Cancelada"; a Pauta continua editável |
| Mês sem sincronizar e sem rede | Mensagem "Este período ainda não foi carregado. Conecte-se para ver" |
| Erro inesperado | Tela "Algo deu errado" com botão "Voltar para a Agenda"; o conteúdo digitado não se perde |

## Pendências
- Nenhuma. Duas decisões vieram de sugestão minha, não de resposta direta do Ivan: ausência de barra de abas inferior e o rascunho do Modo Reunião mostrar as notas rápidas. Podem ser ajustadas.
