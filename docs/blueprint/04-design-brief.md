# Design Brief — UI e UX

> Tom e temas vieram do Ivan: minimalista, claro e escuro. Paleta, fonte e componentes são **sugestões** (ele não tem preferência) e podem ser trocados.

## Tom visual
Minimalista, calmo e funcional. O app é uma ferramenta de uso rápido, muitas vezes com uma mão só e com pouca atenção disponível, então a interface some e o conteúdo (reuniões, itens, texto) aparece. Muito espaço em branco, poucas cores, nada decorativo, sem ilustrações nem gradientes. Referências de estilo: Google Agenda (estrutura de visões e navegação), Apple Notes e Things (checklist limpo, foco no texto).

## Temas
- **Claro e escuro**, os dois na primeira versão.
- Segue o tema do sistema por padrão; Configurações tem o seletor "Sistema / Claro / Escuro".
- Todas as cores abaixo são definidas como variáveis, para a troca de tema não exigir mudança de componentes.

## Paleta de cores
Neutros em escala de cinza levemente azulada, e **uma única cor de destaque** (azul).

| Uso | Claro | Escuro |
|---|---|---|
| Fundo da tela | `#FFFFFF` | `#0E1013` |
| Superfície (cartões, campos) | `#F5F6F8` | `#171A1F` |
| Borda e divisores | `#E3E6EA` | `#272B32` |
| Texto principal | `#14171A` | `#F2F4F6` |
| Texto secundário | `#5C6670` | `#9AA3AD` |
| Destaque (botões, item marcado, "hoje") | `#2563EB` | `#5B8DEF` |
| Destaque, texto sobre ele | `#FFFFFF` | `#0E1013` |
| Reunião em andamento (fundo leve) | `#EAF1FE` | `#16233F` |
| Aviso/offline | `#B45309` | `#F59E0B` |
| Erro/cancelada | `#B42318` | `#F97066` |

Regras:
- O azul de destaque aparece só em: ação principal, item marcado, hoje, reunião em andamento. Nada mais é colorido.
- Contraste mínimo de 4.5:1 para texto em ambos os temas.
- Estado nunca depende só de cor: item marcado também fica riscado e esmaecido; "Cancelada" também tem texto.

## Tipografia
- **Fonte única: Inter** (fallback: fonte de sistema). Uma só família mantém o visual limpo e carrega rápido.
- Títulos de tela: 20 px, peso 600.
- Título da reunião na lista: 16 px, peso 500.
- Corpo e itens do checklist: 16 px, peso 400 (nunca menor que 16 px para evitar zoom automático do iOS ao focar um campo).
- Texto secundário (horário, progresso): 13–14 px, cor secundária.
- **Modo Reunião:** itens do checklist em 20 px, para leitura rápida de relance.

## Componentes e estilo
- **Bordas:** arredondadas, raio de 12 px em cartões e campos, 999 px em botões de ação e selos.
- **Sombras:** nenhuma no repouso; elevação só em quem flutua (botão de ação, folha de baixo). Separação por borda fina e cor de superfície.
- **Densidade:** espaçada. Área de toque mínima de 44×44 px em tudo que se toca. Itens do checklist com 48 px de altura; no Modo Reunião, 64 px.
- **Cartão de reunião:** horário à esquerda, título e progresso (ex.: `3/5`) à direita; reunião em andamento com fundo de destaque leve e o atalho "Modo Reunião".
- **Checklist:** caixa de seleção redonda à esquerda, texto no meio, alça de arrastar à direita (só na Pauta, não no Modo Reunião). Item marcado: caixa preenchida de azul, texto riscado e esmaecido.
- **Botão principal:** preenchido em azul, texto branco. **Botão secundário:** só texto e borda fina. Um botão principal por tela.
- **Campos:** fundo de superfície, sem borda no repouso, borda azul de 2 px em foco.
- **Ícones:** traço fino de 1.5 px, estilo Lucide, um tamanho (20 px).
- **Mês (grade):** dias em números simples; dia com reunião tem um ponto azul; hoje tem o número em círculo azul preenchido.
- **Movimento:** transições curtas (150–200 ms) só em abrir/fechar telas e marcar item. Respeita "reduzir movimento" do sistema.
- **Feedback:** marcar um item dá uma vibração leve (quando o aparelho permite).

## Padrão por tipo de tela
- **Agenda (lista):** cabeçalho fixo com seletor Dia/Semana/Mês, setas de período, "Hoje" e ícone de Configurações. Lista agrupada por dia, com o dia de hoje rolado para a vista e seu rótulo em azul. Puxar para baixo sincroniza.
- **Pauta (edição):** título e horário no topo. Campo "Adicionar item" sempre visível logo abaixo do último item. Anotações livres em área larga abaixo do checklist, que cresce com o texto. Botão "Modo Reunião" fixo no rodapé. Salvamento automático, com indicador discreto "Salvo".
- **Modo Reunião:** fundo da tela sem nenhum elemento extra: título pequeno no topo, botão "Sair", itens grandes ocupando a tela, campo de nota rápida recolhido no rodapé. Itens marcados descem para o fim. A tela fica sempre ligada.
- **Configurações:** lista simples em linhas (conta, tema, sincronizar agora, sair), sem cartões.
- **Login:** logotipo/nome centrado, uma frase de explicação e o botão "Entrar com Google". Nada mais.
- **Feedbacks e estados** (offline, erro, vazio): faixa fina no topo (offline, falha) ou texto centrado com um botão (vazio, erro). Nunca modal para avisos informativos.
- **Mobile primeiro:** layout de coluna única até 768 px. Acima disso (fase de desktop), duas colunas: lista à esquerda, Pauta à direita. Respeita as áreas seguras do iPhone (entalhe e barra inferior).

## Identidade
- **Nome exibido:** Pautas.
- **Ícone do app (PWA):** quadrado azul `#2563EB` com um check branco simples. Sugestão minha, sem preferência do Ivan.
- **Cor da barra do navegador (theme-color):** igual ao fundo da tela em cada tema.

## Pendências
- Nenhuma. Paleta, fonte e ícone são sugestões minhas; qualquer um pode ser trocado antes da construção.
