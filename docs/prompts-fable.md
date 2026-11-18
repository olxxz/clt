# Prompts para o Fable

Tarefas em que o raciocínio do Fable paga o custo dobrado: muita leitura
cruzada, decisão de design, bug sutil. Cada prompt é para uma sessão NOVA, e
pede um RELATÓRIO/PLANO, não implementação — implementar, rodar build e testar
no navegador é trabalho para o Opus, que custa metade. Cole o prompt inteiro.

Ordem sugerida: 1 → 2 → 3 → 4. O 1 é o que mais muda o jogo.

---

## 1. Rebalanceamento (o jogo está duro demais)

```
Leia o CLAUDE.md e, em docs/DECISOES.md, as seções "Balanceamento", "Os modos
de jogo" e "Embalo". Depois leia src/game/engine.ts, src/game/regras.ts e
scripts/simular.ts.

Problema: o bot mediano vence ~0,7% das runs e morre de burnout no dia 5. A
meta decidida é 10–20% de vitória. O CLAUDE.md diz que o gargalo são as
REGRAS (o +2 de estresse por cota perdida, o −3 do fim de semana, a cota da
semana 1), não as cartas.

Antes de rodar: o simulador exige um arquivo exportado do banco
(Lab › Simulador, `npm run simular -- --de arquivo.json`). Se ele não estiver
no repositório, me peça e pare até eu enviar.

O que quero:
1. Explique a espiral com números: por que a run típica morre na semana 1,
   qual regra pesa mais.
2. Rode o simulador (com --inicial e com o baralho equipado) variando as
   regras do modo, uma alavanca de cada vez e depois combinações. Se o +2 por
   cota perdida estiver fixo no engine.ts, você pode parametrizá-lo
   localmente para medir, mas sem commitar.
3. Proponha UM conjunto de números para o modo "normal" que caia em 10–20%
   e mantenha o despejo possível (hoje ele é 0%, ou seja, o dinheiro não
   importa). Mostre a tabela de resultados de cada tentativa.
4. Diga quais cartas ficam fortes ou inúteis demais com os números novos
   (o relatório por carta do simulador).

Entregue em docs/balanceamento-proposta.md. NÃO altere o banco nem as regras
de produção: os números vou aplicar eu, no /lab/regras. Não mexa em interface.
Faça commit só desse arquivo (e do simulador, se você tiver melhorado ele).
```

---

## 2. Auditoria de segurança do banco

```
Leia o CLAUDE.md (seção "Banco") e o supabase/schema.sql inteiro. Depois os
arquivos em src/data/ que chamam as RPCs.

O site é estático e chama o Supabase direto do navegador com a chave anon,
então TODA a segurança está no Postgres: RLS, funções security definer,
grants. Regras que não podem ser quebradas: nome, e-mail e pontos de um
jogador nunca saem para outra pessoa; só admin altera catálogo, feedback de
terceiros e envia presentes; ninguém lê `runs`/`players` direto; convidado
não ganha poderes de conta.

Audite como um atacante com a chave anon e uma conta comum (e outra de
convidado), chamando qualquer RPC com quaisquer argumentos:
- funções security definer sem `set search_path`, ou que confiam em um
  argumento (p_player_id etc.) em vez de auth.uid();
- vazamento de e-mail/nome/pontos por qualquer caminho (incluindo
  email_para_entrar, colecao_de_amigo, jogo_publico, conquistas ocultas);
- RPCs que deixam dar recompensa, token, carta ou conquista a si mesmo ou
  a outra pessoa;
- grants para anon/authenticated mais largos que o necessário;
- abuso de volume (criar_convidado, tentativas de senha, feedback em massa);
- o que o schema.sql faz quando roda de novo num banco que já existe.

Para cada achado: gravidade, a chamada exata que explora, e a correção em SQL.
Separe o que é falha real do que é risco aceito (o CLAUDE.md lista alguns,
como criar_convidado sem limite). Entregue em docs/auditoria-seguranca.md.
Não aplique nada no banco. Não edite o schema.sql: as correções vão no
relatório para eu revisar.
```

---

## 3. Revisão do motor (bugs de borda)

```
Leia o CLAUDE.md (seção "Regras do motor que valem hoje") e, em
docs/DECISOES.md, a seção "O que a carta faz é dado". Depois leia
src/game/engine.ts, acoes.ts, custos.ts, colecao.ts e types.ts por inteiro.

O motor acumulou ~47 versões de recursos empilhados: pausas no meio da lista
de ações (escolhaAberta, escolhaDeDescarte com guardar, rolagemAberta, o
`resto` e o empilhamento em dispararEfeitos), a fila do `amanha` rodando no
startDay, gatilhos aoDescartar/fimDaSemana, recorrentes com duração, custos
pagos antes dos efeitos, embalo, migrações na leitura.

Procure bugs de verdade, com o estado concreto que os dispara:
- pausa dentro de pausa (escolha dentro de sorteio dentro de se; rolagem
  dentro do entao de um descarte); o resto perdido ou rodado duas vezes;
- derrota que acontece no meio de uma pausa, ou no startDay, sem ser
  detectada, ou detectada duas vezes;
- canPlay e playCard discordando (a carta passa no canPlay e falha no
  meio, ou o contrário);
- aoDescartar disparando no descarte de fim de dia, ou a carta guardada
  disparando;
- o que acontece com o baralho e o descarte vazios ao mesmo tempo;
- saves antigos (campos opcionais ausentes) passando por cada caminho.

Escreva um script descartável (no scratchpad, não no repositório) que
monte cada estado e prove o bug rodando o motor de verdade. Relate só o
que conseguiu reproduzir; o resto vai numa lista curta de suspeitas.
Entregue em docs/revisao-motor.md, com a correção proposta para cada um. Não
corrija o código: eu passo a correção para outra sessão.
```

---

## 4. A espiral legível (plano de UX + motor)

```
Leia o CLAUDE.md, e em docs/DECISOES.md as seções "Decisões de interface",
"Balanceamento" e "Pendências abertas" (item "Espiral visível e o jogo duro
de propósito"). Depois src/app/(app)/jogar/ (a mesa), src/game/engine.ts e
src/components/Medidor.

Decisão já tomada: o jogo vai ser difícil (10–20% de vitória), e por isso
a espiral do estresse tem que ser LEGÍVEL. Hoje o jogador perde na semana 1
sem entender que cada dia sem bater a cota encolhe a energia do dia seguinte
(Energia = 10 − Estresse). Ideias já levantadas: prévia da jogada rodando
playCard puro, "amanhã: X de energia", zonas de perigo no medidor de
estresse, a cota como barra, um veredito no fim do dia, tirar o −N vermelho
falso na virada da produtividade, e o +2 por cota perdida virar regra de
`modos`.

Quero um PLANO, não código:
1. Quais dessas ideias de fato ensinam a espiral e quais são ruído; o que
   está faltando.
2. Para cada uma escolhida: onde aparece na mesa (desktop e celular, que
   já está apertado — leia as regras de layout do CLAUDE.md), o que mostra,
   e qual função pura do src/game/ fornece o número (sem regra em componente).
3. A ordem de implementação em entregas pequenas, cada uma testável sozinha,
   e o que medir no navegador em cada uma.
4. Riscos: performance de rodar playCard a cada hover, a regra de não
   rolar a página, a mão do celular.

Entregue em docs/plano-espiral.md. Não implemente: o plano vai ser
executado em outra sessão.
```

---

## Quando o Opus empacar

Se um problema resistir a 2–3 tentativas no Opus (geometria do avatar, bug que
volta), abra uma sessão no Fable com:

```
Leia o CLAUDE.md. O problema: <descreva o que aparece e o que deveria
aparecer>. Já foi tentado: <as tentativas e por que falharam>. Arquivos:
<caminhos>. Analise a causa raiz e proponha a solução, com o porquê de as
tentativas anteriores não terem funcionado. Não implemente nem teste no
navegador; só explique e mostre o trecho de código proposto.
```
