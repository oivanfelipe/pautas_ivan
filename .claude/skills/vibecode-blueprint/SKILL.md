---
name: vibecode-blueprint
description: Antes de gerar código ou prompts para Vibecode, Lovable, Bolt, v0, Cursor ou qualquer app builder de IA, cria os 6 documentos de planejamento (PRD, TRD, AppFlow, Design Brief, Esquema de Backend, Plano de Implementação) que dão ao agente de código o contexto completo para construir o app certo desde a primeira tentativa. Ativadores: "quero criar um app", "vou construir isso no Vibecode/Lovable/Bolt/v0", "preciso montar um MVP", "planejar um produto antes de codar", "gerar PRD", "documentação de app".
---

# Vibecode Blueprint

## Por que essa skill existe

Um agente de código que recebe só uma ideia solta ("cria um app de agendamento pra barbearia") preenche as lacunas chutando: escolhe stack sozinho, inventa fluxo de tela, decide schema de banco sem contexto de negócio. O resultado é retrabalho.

Os 6 documentos abaixo eliminam esse chute. Cada um resolve um tipo de decisão específica, e juntos formam o contexto completo que qualquer agente (Claude Code, Cursor, Vibecode, Lovable, Bolt, v0) precisa antes de escrever a primeira linha.

## Quando usar

Sempre que o usuário pedir para criar, planejar ou estruturar um app, produto digital ou MVP, e ainda não existir nenhum dos 6 documentos para esse projeto. Não pule direto para código ou para um prompt de app builder sem eles.

Se o usuário já tiver os documentos (ou parte deles) em outro lugar, leia e valide o que existe antes de gerar o que falta, em vez de recriar do zero.

## Os 6 documentos

| # | Documento | Resolve | Template |
|---|---|---|---|
| 1 | PRD (Documento de Requisitos do Produto) | O quê construir | `templates/01-prd.md` |
| 2 | TRD (Documento de Requisitos Técnicos) | Com quê construir | `templates/02-trd.md` |
| 3 | AppFlow | Como o usuário navega | `templates/03-appflow.md` |
| 4 | Design Brief (UI/UX) | Qual a cara do app | `templates/04-design-brief.md` |
| 5 | Esquema de Backend | Como os dados são guardados | `templates/05-backend-schema.md` |
| 6 | Plano de Implementação | Em que ordem construir | `templates/06-implementation-plan.md` |

A ordem importa. Cada documento depende de decisões tomadas no anterior:
PRD define as funcionalidades → TRD escolhe a stack que suporta essas funcionalidades → AppFlow mapeia a navegação das telas que essas funcionalidades exigem → Design Brief dá forma visual a essas telas → Esquema de Backend estrutura os dados que essas telas manipulam → Plano de Implementação sequencia a construção de tudo isso.

## Fluxo de trabalho

### 1. Coletar contexto antes de escrever

Nunca preencha os templates com suposições. Se o usuário não deu informação suficiente, pergunte antes de avançar, priorizando nesta ordem:

1. Qual é a ideia do app em uma frase, e para quem é (público-alvo)
2. Quais são as funcionalidades essenciais da primeira versão (não a lista de sonhos, o mínimo que já entrega valor)
3. Se já existe alguma restrição técnica: stack preferida, integrações obrigatórias (pagamento, autenticação, API externa), plataforma (web, mobile, ambos)
4. Se existe referência visual ou de marca (cores, tom, apps parecidos que o usuário gosta)

Não precisa perguntar tudo de uma vez. Vá preenchendo o PRD primeiro e use as lacunas dele para guiar as perguntas seguintes.

**Continue perguntando até fechar cada documento, não pare na primeira rodada.** Faça uma pergunta ou um pequeno grupo de perguntas por vez (nunca um questionário longo de uma vez só), leia a resposta, identifique o que ainda ficou vago ou incompleto para aquele documento especificamente, e pergunte de novo sobre só o que falta. Repita esse ciclo pergunta → resposta → nova pergunta até que o documento em questão esteja completo, sem placeholder genérico e sem suposição sua preenchendo o buraco. Só então escreva a versão final daquele documento e siga para o próximo. Se o usuário responder de forma vaga ou incompleta, não avance mesmo assim: refaça a pergunta de outro jeito, mais específica, até obter uma resposta que realmente feche a lacuna. A única exceção é quando o usuário disser explicitamente que não sabe ou que decida por ele; nesse caso, proponha uma opção razoável, deixe claro que foi uma sugestão sua (não um fato dado por ele) e siga adiante.

### 2. Gerar os documentos em sequência

Siga a ordem da tabela. Ao final de cada documento, apresente um resumo curto do que foi decidido e pergunte se o usuário quer ajustar algo antes de seguir para o próximo. Isso evita retrabalho em cascata (mudar o PRD depois do Esquema de Backend já pronto invalida o schema).

Use os arquivos em `templates/` como estrutura de cada documento. Preencha com o conteúdo real do projeto, sem deixar placeholders ou marcações do tipo `[a definir]` a menos que o usuário explicitamente não saiba responder algo ainda, e nesse caso marque como pendência visível, não como texto genérico.

### 3. Entregar como arquivos

Ao final, os 6 documentos devem existir como arquivos Markdown separados (não um documento único), porque o agente de código costuma referenciar cada um individualmente durante a construção. Nomeie:

```
01-prd.md
02-trd.md
03-appflow.md
04-design-brief.md
05-backend-schema.md
06-implementation-plan.md
```

### 4. Não pule etapas mesmo sob pressão de tempo

Se o usuário disser "não precisa de tudo isso, só me dá o prompt pro Vibecode", explique em uma frase o risco (o agente vai inventar decisões de stack, tela e dados sem esse contexto) e ofereça uma versão reduzida: pelo menos PRD e AppFlow, que são os dois que mais previnem retrabalho, antes de gerar o prompt final.

## Depois dos 6 documentos

Uma vez prontos, eles servem como contexto persistente do projeto. Ao gerar o prompt final para o app builder (Vibecode, Lovable, Bolt, v0, ou instruções para Claude Code construir diretamente), referencie os 6 documentos em vez de resumir tudo de novo em um prompt solto.
