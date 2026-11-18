# CLT — contexto do projeto

Resumo para quem (pessoa ou IA) for mexer neste repositório. **A história
inteira de cada decisão** (versões recusadas, medições, porquês longos) mora em
[`docs/DECISOES.md`](docs/DECISOES.md): antes de mexer numa área delicada
(motor, avatar, recompensas, banco, mesa), leia a seção dela lá — é busca por
título, não leitura inteira. O [`README.md`](README.md) é o documento do jogo
(regras, cartas). `CONTEXTO-TOTAL-<data>.md` é uma foto datada e
`CONTEXTO-VOZ.md` está desatualizado; se discordarem, este arquivo ganha.

**Trabalho de faculdade.** Luiz Adolfo Frederico — CC4M. Single player, sem
monetização, sem dados sensíveis.

---

## O jogo

Card game roguelike: atravessar um mês de trabalho formal sem ficar no vermelho
e sem surtar. Dia = rodada, semana = cobrança do chefe, mês = run (20 dias).
**O estresse não some sozinho**: `Energia do dia = 10 − Estresse`. Recursos:
energia (reinicia), estresse (acumula), produtividade (zera todo dia, é a cota),
dinheiro (acumula, sai nas contas de sexta). Derrotas: estresse 10 (burnout),
3 advertências (demissão), não pagar a sexta (despejo). Pontuação = dinheiro
que sobrou.

No ar em <https://lx-xz.github.io/clt/>, deploy automático a cada push no
branch padrão (`.github/workflows/pages.yml`).

**Rotas:** `/auth` (porta, fora de `(app)`), `/` (início limpo: capa do avatar,
um botão Jogar/Continuar, missões), `/jogar` (a mesa, tela cheia sem rolagem),
`/baralho`, `/ranking`, `/perfil` e `/jogador?nick=` (o MESMO componente
`components/Perfil`), `/perfil/editar` (avatar), `/meus-jogos[?nick=]`,
`/meus-jogos/detalhe?id=` (replay), `/comunidade[?aba=feedbacks|analise]`
(as abas são o cabeçalho; passar o mouse em "Comunidade" na barra abre um
menu com elas, que mora FORA do painel porque o painel corta o que vaza),
`/maquina` (máquina de vendas com tokens), `/termos`, `/nova-senha`,
`/lab/*` (oficina, só admin), `/apresentacao` e `/video` (a apresentação
do trabalho e o motion graphics, fora do jogo e sem login, linkados do lab).

A **Análise** (`comunidade/Analise.tsx`) desenha os gráficos em SVG à mão,
medidos pela largura do cartão; as cores dos desfechos foram validadas para
daltonismo nos dois temas, e vermelho e verde nunca ficam lado a lado.

---

## Stack

Next 15 (App Router, **export estático**, sem servidor) · React 19 ·
TypeScript 5 (**não subir para a 7**: quebra o `next.config.ts`) · Sass
**indentado** (`.sass`, pedido do autor; não converter) · `lucide-react` ·
`@supabase/supabase-js` chamado do navegador.

Recusado de propósito: lib de animação, gerenciador de estado, framework de UI.
Só adicione dependência se ela pagar o próprio peso.

---

## Arquitetura

```
src/game/     regras puras — NENHUM import de React
  types.ts acoes.ts catalogo.ts regras.ts colecao.ts baralho.ts custos.ts
  missoes.ts tokens.ts cosmeticos.ts descricao.ts ids.ts engine.ts
  storage.ts session.ts
src/data/     tudo que fala com o Supabase (conta, saves, sync, cartas,
              feedback, amizades, conquistas, presentes, contasSalvas, som…)
              e as preferências do aparelho (tema, estiloDaArte)
src/data/artes/   o rabisco de cada carta, pelo id (índice GERADO)
src/components/  uma PASTA por componente: X/X.tsx, X/X.module.sass, X/index.ts
src/app/      auth/, termos/, (app)/ (layout com guarda de sessão + barra lateral)
supabase/schema.sql  o banco inteiro (rodar no SQL Editor); reset.sql apaga tudo
scripts/simular.ts   simulador de balanceamento (npm run simular)
scripts/arte/        gerador da arte das cartas (API da OpenAI) e do índice
```

**O princípio:** `src/game/` é um conjunto de funções puras sobre `GameState`.
Isso permite simular runs fora do navegador. **Não coloque regra em componente.**

Componente novo nasce em pasta própria; quem importa escreve `@/components/X`;
de um componente para outro, `../X`.

---

## Regras do motor que valem hoje

- **Carta e evento são DADO.** `ActionCard.efeitos` é uma lista de ações do
  catálogo em `src/game/acoes.ts`, cada bloco com `se` e `quando` opcionais.
  `playCard`/`revealEvent` rodam a lista; **o motor não conhece id de carta
  nenhuma.**
  1. Composição na LISTA, não em primitiva nova ("reembaralhar 1" =
     `descartar(1)` + `comprar(1)`).
  2. Não é linguagem de programação: sem laço, variável, expressão. A régua:
     **cabe numa carta que alguém lê em três linhas?**
  3. Ação nova precisa de descritor em `src/app/(app)/lab/_catalogo/descritores.ts`
     (`satisfies Record<Acao['faz'], Descritor>` quebra o build) e de linha em
     `descreverAcao` (`src/game/descricao.ts`, também sem `default`).
- **Vocabulário mudou? Traduza na LEITURA** (`migrarAcoes`), nunca tire um nome
  da união sem isso — o `switch` de `executarAcao` não tem `default` e a ação
  sumiria em silêncio. Mesmo padrão em `lerAvatar`, `lerColecao`, `custosDaLinha`,
  `migrarRun`, `traduzirIds`: **formato antigo se traduz na leitura, sem migração.**
- **Pausas:** `escolha`, `escolherDescarte`, `guardarParaAmanha` e a rolagem
  de dados na mesa (`rolagemAberta`) PARAM a lista e guardam o `resto`.
  `escolha` é só de carta (num evento, `revealEvent` a descarta). Sem a mesa
  (`jogarDadosNaMesa(false)`, simulador) o motor sorteia na hora pelo `ctx.sorte`.
- **Comprar, descartar, embaralhar e sortear são do motor** (`contexto()`), não
  ações: nenhuma carta muda essas regras, e o sorteio determinístico depende disso.
- **`startDay` pode matar** (a fila do `amanha`): termina em `checkDefeat`.
- **A descrição da carta é gerada das ações** (`descreverCarta`, notação
  `{energia}` `{estresse}` `{produtividade}` `{dinheiro}` `{advertencia}`
  desenhada por `TextoComIcones`). O texto escrito é o COMENTÁRIO (sátira).
- **Custos:** energia em `cost`; dinheiro e produtividade em `custos` (lista).
  Custo é pago ANTES dos efeitos. Custo de estresse não existe mais (vira o
  primeiro efeito na leitura, `estresseViraEfeito`).
- **Carta neutra** (`kind: null`) não é alcançada por bloqueio e QUEBRA o embalo.
- **Embalo:** cartas seguidas da mesma classe rendem bônus crescente.
- **Os números do jogo são um MODO** (tabela `modos`, `/lab/regras`;
  `MODO_NORMAL` em `regras.ts` vale com a tabela vazia). A run copia o modo ao
  começar (`GameState.modo`) e o motor lê de lá. Número de regra dentro de
  carta é sempre RELATIVO (`maoDoDia relativo: true`), nunca o total somado.
- **Coleção:** `Collection = { tenho, baralhos, ativo, tokens, envelopes,
  missoes, cosmeticos, … }`. Teto de cópias pela raridade (5/4/3/2/1). Regras
  do baralho são do modo e conferidas por `problemasDoBaralho()`. Carta vem de
  recompensa (envelope/pacote/maleta/cofre, `ENVELOPES` em `missoes.ts`),
  sorteada ao GANHAR; sobra vira token; a máquina vende por token.
- **Mudou o formato de `GameState`?** Campo OPCIONAL não precisa de nada.
  Campo obrigatório: suba a chave em `storage.ts` e acrescente em
  `CAMPOS_DA_RUN` — save antigo já derrubou a mesa em produção.
- **Refatorou o motor? Confira com o simulador** (`--hash`, mesma semente,
  mesmo arquivo `--de`): a saída tem que bater.

## Cartas, versões e o banco como fonte

- **As cartas moram SÓ no banco** (`cartas`, `cartas_evento`) desde a v0.39.
  O catálogo nasce vazio, a RPC `catalogo` o enche, e a última resposta fica no
  navegador (`clt:catalogo:v1`). Sem banco e sem cópia, a guarda mostra "Não
  consegui carregar as cartas". **Carta e evento se mudam no `/lab`, e só lá.**
- **Nada é apagado:** remover é `ativa = false` + linha em `cartas_antigas`.
  Todo salvamento grava `o_que` (automático) e `porque` (opcional).
- **A run guarda o próprio retrato** (`GameState.baralho`, `versaoDoBaralho`,
  `runs.details.modo`): rebalancear não reescreve partida antiga. `cartaComoEra()`
  procura retrato → catálogo → removidas → rótulo honesto.
- **`getCard` com id desconhecido devolve carta inerte** e avisa no console.
- **Todo id é UUID.** Ids antigos (`hora-extra`) viram uuid v5 no `ESPACO` de
  `src/game/ids.ts`. **Nunca mude o `ESPACO` nem apague `idsAntigos.ts`.**

---

## Interface — o que preservar

- **Leque + carta estilo TCG**, mesa em `100dvh` sem rolagem, carta em 3D com
  verso (estampa Coffee/Hammer/Droplet). Clique abre o detalhe, clique duplo ou
  arraste até o tapete joga; arrastar na faixa da mão reordena.
- **Nenhuma página rola** (`html, body { overflow: hidden }`), exceto as que
  usam a classe global `.page` (o baralho) — página nova que precise rolar usa
  `.page` ou ganha exceção própria.
- **Toda carta arrastável tem `data-carta`** (a barra lateral ignora gesto que
  começa nela) e `touch-action: none` só nela (`.arrastavel`).
- **Barra lateral** recolhível (76/256 px), no celular abre arrastando da
  esquerda em qualquer ponto. **Nada de barra inferior no celular** (recusado).
- **Todo popup é o `Dialogo`** (`nota` para dinheiro/resultado, `prancheta`
  para o resto; `semTravarNav` na mesa; sem `onFechar` não fecha). Não escreva
  popup à mão.
- **Ação destrutiva confirma com segundo clique** (`BotaoConfirmar`), não popup.
- **Dinheiro na tela não leva "R$"**: `<Dinheiro valor={n} />`. "R$ N" só em
  texto que vem de dado (é notação, `TextoComIcones` desenha o ícone).
- **Tema** claro/escuro/sistema via `data-tema` no `<html>`, aplicado por script
  no `<head>`. Nenhum componente conhece cor; tokens em `src/styles/_tokens.sass`
  (paleta "papelada de escritório"). Cortina de popup é `--cortina`.
- **Barra dividida (sorte e caminhos) é SEM COR** — pedido do autor.
- **Carta indisponível fica ESCURA** (`filter: brightness`), não transparente.
- **Uma partida acaba num RECIBO**, o mesmo componente em todo lugar
  (`components/Recibo`). Compartilhar desenha no canvas, com cores fixas.
- **Slider, Check e Interruptor são desenhados**, não nativos. Campo de
  formulário sempre com fonte ≥ 16px (zoom do iPhone).
- **Música e efeitos:** Web Audio com `GainNode` (iOS ignora `audio.volume`);
  volume zero = `pause()` + `suspend()` (senão rouba o som do aparelho).
- **Changelog** (`src/data/changelog.ts`) é escrito à mão, para quem JOGA:
  poucas linhas, nada de banco/lab/retrabalho de desenho.

### Arte das cartas (v0.48, `src/data/estiloDaArte.ts`, `src/data/artes/`)

Pedido do grupo que jogou. Em Configurações › Aparência: **ícone** (o
padrão: só o ícone do meio, na cor da raridade, sem o selo do canto) ou
**rabisco** (com o selo do canto, sem fundo, na cor da raridade) — o padrão
é o ícone para o autor mostrar o "antes e depois" na apresentação; a escolha mora em `clt-arte:v1`, com
hífen, porque é do aparelho e `limparLocalDoJogo` apaga o `clt:`.
- **A imagem mora no CÓDIGO, pelo id da carta** (`src/data/artes/rabisco/<uuid>.webp`),
  importada pelo índice GERADO (`node scripts/arte/indice.mjs`): é asset,
  não balanceamento, e importada ganha o `/clt` do Pages. Carta sem imagem
  (criada no `/lab` depois) mostra o ícone.
- **O rabisco é MÁSCARA**: só o alfa, pintado no CSS com `--cor-raridade`
  (no evento `--cor-tom`, na comum `--selo-comum`) — a cor segue a raridade
  do banco e o tema. Com imagem, a arte mora no papel da carta (`.comImagem`).
- **Quem desenha é a OpenAI** (`scripts/arte/gerar.py`, cena por carta em
  `cenas.py`; gpt-image-1.5, que gera sem fundo). Regras do autor: nenhum
  objeto com rosto, pessoa só como boneco de traço, sem texto. **Custa
  dinheiro do autor: diga quanto antes de gerar em lote** (uma rodada sem
  aviso gastou US$ 5). Carta nova: linha em `catalogo.json` e `cenas.py`,
  rodar o gerador (pula o que existe) e o `indice.mjs`.
- Recusados: a colagem de papelaria (chegou a ser opção) e cenas com os
  avatares. A história está em `docs/DECISOES.md` › A arte das cartas.

### Avatar (`components/Avatar`, `src/data/avatar.ts`)

Uma RECEITA em `jsonb`, desenhada em SVG na hora; `lerAvatar()` valida na
leitura (peça desconhecida → padrão), por isso `salvar_avatar()` não valida.
Regras que custaram caro (detalhes em `docs/DECISOES.md`, seção do avatar):
sem gênero na receita; desenho CHAPADO, cabelo de uma cor só, **nenhum
contorno**; moldura é CSS, desenho é SVG; cortes, acessórios, olhos e troncos
são TABELAS (`CABELOS_FORMA`, `ACESSORIOS`, `OLHOS`, `TRONCOS`), corte novo
nasce da caixa do rosto (`MEDIDAS`); ids de SVG via `useId()` sem pontuação;
o manequim é o padrão de quem não escolheu. **Cosmético novo se testa em TODOS
os cortes × os três rostos** numa página temporária do `/lab` (não comitar).

---

## Armadilhas conhecidas

Cada uma já mordeu. O relato completo está em `docs/DECISOES.md`.

- **`switch` sem `default`** transforma dado desconhecido em silêncio (veja acima).
- **Item flex não encolhe abaixo do min-content:** `min-width: 0` no painel.
- **Tecla em `window` atravessa popup aninhado:** sobreposição que nasce de
  outra ouve na captura e para a propagação.
- **Navegação que falha mostra o `.txt` do export:** remendado por
  `scripts/remendar-next.mjs` no `postinstall` — ao subir o Next, confira se o
  remendo ainda acha o trecho. Sair da conta é `location.replace`.
- **3D de CSS se achata em silêncio:** nada de `overflow`/`filter`/`opacity`/
  `clip-path`/`mask` entre a cena e as faces.
- **`mask`, `filter` e `perspective` viram bloco contentor de `position: fixed`:**
  popup dentro da nota fiscal precisa de portal; a carta arrasta por delta de
  `transform` (`--ddx/--ddy`), nunca por posição absoluta.
- **Página que é a ÚNICA a importar um componente pelo `index.ts`** pode sumir
  do build (Next 15.5): importe direto do arquivo.
- **`getBoundingClientRect()` devolve a caixa transformada:** meça o slot.
- **Pseudo-elemento por cima precisa de `pointer-events: none`.**
- **Inline style ganha de `:hover`:** o inline escreve `--lift`, o CSS compõe `--ty`.
  Uma regra só lê `var()` cascateado no elemento — não "simplifique" o
  `.aberta .painel` da barra lateral.
- **Regra depois de `@media` ganha da de dentro** (mesma especificidade).
- **`flex` com base em px num container que virou coluna** vira altura.
- **No toque, `pointerenter` dispara com o clique:** hover só para `pointerType === 'mouse'`.
- **Dica presa ao elemento é cortada nas bordas:** `position: fixed` + limite.
- **`:hover` gruda no toque** — o que põe carta por cima é só de mouse.
- **Safari pinta posicionado pela ordem do DOM, não pelo `order`:** use `z-index`.
- **A mesa não abre antes do catálogo** (`SessaoGuard` espera `catalogoPronto()`).
- **Run terminada não vai em timer com debounce:** `registrarRunAgora()` grava
  na hora, com fila em `clt:runs-pendentes:v1`, e mostra o erro cru na tela.
- **`enviarRun` usa `insert` cru e trata `23505` como sucesso. Não troque por
  `upsert`** (exigiria SELECT para o `anon`).
- **Rota de detalhe é query string + `<Suspense>`** (export estático não tem rota dinâmica).
- **basePath:** o Next não prefixa `src` de mídia nem o conteúdo do manifest;
  imagens se IMPORTAM. Ícone do iPhone é `apple-icon.png` opaco.
- **Áudio só toca depois de interação;** `createMediaElementSource` uma vez por elemento.
- **`schema.sql` precisa rodar de novo sem erro:** `drop policy if exists` antes
  de cada `create policy`; toda função entra no bloco de `drop function`
  (com assinatura) e o `grant` vem depois do `create`; o gatilho em
  `auth.users` cai ANTES da função; termina com `notify pgrst, 'reload schema'`.
  Blocos de migração comparam `coluna::text`.
- **URL do Supabase é a do projeto pura** (não a `/rest/v1`).
- **"Confirm email" ligado = cadastro sem sessão** (`precisaConfirmar`).
- **Redirect do Google precisa estar na lista do Supabase** (`/auth/` em localhost e no Pages).
- **Sair/entrar como convidado limpa o localStorage `clt:`**; a lista de contas
  salvas é `clt-contas:v1` (hífen de propósito) e trocar de conta é
  `setSession`, nunca `signOut`.

---

## Banco (Supabase)

Esquema completo em `supabase/schema.sql`. Tabelas: `players`, `saves`, `runs`,
`feedbacks`, `feedback_comentarios`, `notificacoes`, `cartas`, `cartas_evento`,
`cartas_antigas`, `baralho`, `modos`, `amizades`, `conquistas`,
`conquistas_do_jogador`, `presentes`, `tentativas_de_entrada`.

- **Auth do Supabase identifica o jogador**; `players.id = auth.users.id`; o
  perfil nasce pelo gatilho `ao_criar_usuario`. Google chega sem nick
  (`tipo: 'incompleto'`). Convidado não tem Auth (`criar_convidado()`), não
  relata bug, não entra no ranking.
- **Admin se dá no SQL Editor.** Quem é admin, pergunta-se ao banco (`sou_admin()`).
  O `/lab` é trava de conveniência; a segurança é o Postgres.

**Segurança que não se desfaz:**
- `players` sem política nenhuma: o próprio perfil vem de `meu_perfil()`.
  **Nome, e-mail e pontos nunca saem para outra pessoa** — o público é nick,
  avatar e placar (`perfil_publico`, `ranking`, `jogo_publico`).
- `feedbacks`, `amizades`, `conquistas*`, `presentes`, `notificacoes`: sem
  política nem grant; tudo por função `security definer` que confere `auth.uid()`.
- `runs` só aceita `insert` direto; toda leitura por função. Nunca `grant select`
  em `players`/`runs` para `anon`.
- `eh_convidado()` é `security definer`, criada antes das políticas e fora do drop.
- `email_para_entrar` confere a senha ANTES de devolver o e-mail, com limite próprio.
- Chave `service_role` nunca entra no projeto. A anon é pública por natureza.

Variáveis: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
(`.env.local`, e secrets no deploy). Sem credencial não dá para jogar localmente
(decidido).

---

## Rodar e publicar

```bash
npm ci                       # não apague o package-lock.json
cp .env.example .env.local   # preencha antes de rodar
npm run dev                  # http://localhost:3000
npm run build                # com checagem de tipos
npm run build:pages          # out/ com basePath /clt, igual ao CI
npm run simular -- --de arquivo.json   # arquivo exportado no Lab › Simulador
```

---

## Balanceamento e pendências

- **O jogo está duro demais.** Última medição do bot mediano: ~0,7% de vitória,
  ~98% burnout no dia 5, despejo 0%. **Meta decidida: 10–20%**, junto com tornar
  a espiral LEGÍVEL (o `+2` de estresse por cota perdida, hoje fixo em
  `engine.ts`, virar regra de `modos`; prévia de jogada; "amanhã: X de
  energia"; zonas de perigo). O caminho é pelas REGRAS (`/lab/regras`), não
  pelas cartas. Medições e histórico em `docs/DECISOES.md` › Balanceamento.
- **Rodar o `schema.sql` em produção** a cada versão que o mexe (v0.47 é a
  última; a v0.48 não mexe no banco).
- Efeitos sonoros são síntese provisória; faltam arquivos e alguns sons.
- Prêmios de conquista e uso dos pontos de feedback: não decididos.
- Animação de compra da mão, sinergias nomeadas: não feitas.
- Código morto: `embaloAtual()` e `weekNumber()` em `engine.ts`.

---

## Convenções

- **Português** em nomes, comentários e commits (o `src/game/` antigo tem nomes
  em inglês; não renomeie só por consistência).
- **Comentário explica o porquê** — preserve-os ao refatorar.
- **Verificação na medida da mudança:** dado/marcação → `npx tsc --noEmit` e
  `npm run build`; interação/layout → medir no navegador (Playwright); fluxo
  novo → um teste de ponta a ponta no fim.
- **Commit conta o porquê**, com a causa raiz quando conserta bug.
- **Decisão grande nova:** a regra curta vai aqui; a história, se valer, em
  `docs/DECISOES.md`.
- **"Pergunta" ou "constatação" no começo da mensagem = não mexa em nada.**
  Absorva, responda e pare; no fim diga o que faria e pergunte se pode.
