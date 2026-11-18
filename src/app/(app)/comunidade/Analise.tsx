'use client'

import { ChevronDown } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import {
  buscarCartasEncalhadas,
  buscarCartasFatais,
  buscarCartasJogadas,
  buscarEscolhasDeEvento,
  buscarEstatisticasGerais,
  buscarEstatisticasNerds,
  buscarEstressePorDia,
  type CartaFatal,
  type CartaJogada,
  type EscolhaDeEvento,
  type EstatisticasGerais,
  type EstatisticasNerds,
  type EstressePorDia,
} from '@/data/analytics'
import { getCard, getEvent } from '@/game/catalogo'
import { regras } from '@/game/regras'
import buttons from '@/styles/buttons.module.sass'
import Dinheiro from '@/components/Dinheiro'
import styles from './analise.module.sass'

/**
 * A análise (refeita na v0.48): contagens agregadas de todo mundo, para
 * acompanhar o balanceamento. Nenhum nick aparece aqui — nem as runs que o
 * jogador pediu para não guardar, que entram invisíveis só para as contagens.
 *
 * Os gráficos são SVG à mão, medidos pela largura do cartão (sem biblioteca:
 * são quatro, e simples). Toda marca tem dica ao passar o mouse ou tocar, e
 * nenhum número mora SÓ na dica: a legenda, o rótulo ou a tabela o repetem.
 */
export interface Dados {
  gerais: EstatisticasGerais
  nerds: EstatisticasNerds
  cartas: CartaJogada[]
  encalhadas: CartaJogada[]
  fatais: CartaFatal[]
  escolhas: EscolhaDeEvento[]
  estresse: EstressePorDia[]
}

type Estado = { tipo: 'carregando' } | { tipo: 'erro'; mensagem: string } | { tipo: 'pronto'; dados: Dados }

// a ordem é de propósito: vermelho e verde NÃO ficam lado a lado (para quem
// não separa os dois, seriam uma fatia só). Conferido com o validador de
// paleta nos dois temas; as cores moram em analise.module.sass
const DESFECHOS = [
  { chave: 'vitorias' as const, rotulo: 'Vitória', classe: 'corVitoria' },
  { chave: 'demissoes' as const, rotulo: 'Demissão', classe: 'corDemissao' },
  { chave: 'despejos' as const, rotulo: 'Despejo', classe: 'corDespejo' },
  { chave: 'burnouts' as const, rotulo: 'Burnout', classe: 'corBurnout' },
]

const NOME_DO_DESFECHO: Record<CartaFatal['outcome'], string> = {
  burnout: 'burnout',
  demissao: 'demissão',
  despejo: 'despejo',
}

export default function Analise() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' })

  function carregar() {
    setEstado({ tipo: 'carregando' })
    Promise.all([
      buscarEstatisticasGerais(),
      buscarEstatisticasNerds(),
      buscarCartasJogadas(),
      buscarCartasEncalhadas(),
      buscarCartasFatais(),
      buscarEscolhasDeEvento(),
      buscarEstressePorDia(),
    ])
      .then(([gerais, nerds, cartas, encalhadas, fatais, escolhas, estresse]) =>
        setEstado({ tipo: 'pronto', dados: { gerais, nerds, cartas, encalhadas, fatais, escolhas, estresse } }),
      )
      .catch((e: unknown) =>
        setEstado({ tipo: 'erro', mensagem: e instanceof Error ? e.message : 'Não deu para falar com o banco.' }),
      )
  }

  useEffect(carregar, [])

  if (estado.tipo === 'carregando') return <p className={styles.vazio}>Carregando os números…</p>
  if (estado.tipo === 'erro')
    return (
      <div className={styles.erro}>
        <span>{estado.mensagem}</span>
        <button type="button" className={buttons.button} onClick={carregar}>
          Tentar de novo
        </button>
      </div>
    )
  return <Conteudo dados={estado.dados} />
}

function nomeDaCarta(id: string): string {
  try {
    return getCard(id).name
  } catch {
    return id
  }
}

const fmt = (n: number) => n.toLocaleString('pt-BR')
const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

// ------------------------------------------------------------------ a dica
interface Dica {
  x: number
  y: number
  titulo: string
  linhas: [string, string][]
}

/** Uma dica só para a página inteira, presa à tela e limitada à janela. */
function useDica() {
  const [dica, setDica] = useState<Dica | null>(null)
  const mostrar = (e: { clientX: number; clientY: number }, titulo: string, linhas: [string, string][]) =>
    setDica({ x: e.clientX, y: e.clientY, titulo, linhas })
  const esconder = () => setDica(null)
  const caixa = dica ? (
    <div
      className={styles.dica}
      role="tooltip"
      style={{
        left: Math.min(dica.x + 14, (typeof window !== 'undefined' ? window.innerWidth : 9999) - 220),
        top: dica.y + 16,
      }}
    >
      <b>{dica.titulo}</b>
      {dica.linhas.map(([valor, rotulo]) => (
        <span key={rotulo}>
          <strong>{valor}</strong> {rotulo}
        </span>
      ))}
    </div>
  ) : null
  return { mostrar, esconder, caixa }
}

/** A largura de verdade do elemento, para o SVG desenhar em pixels (e o
 *  texto não esticar junto, como esticaria num viewBox deformado). */
function useLargura<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [largura, setLargura] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setLargura(Math.round(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, largura] as const
}

// ------------------------------------------------------------------ página
/** Exportado para conferir o desenho sem banco (com dados de exemplo). */
export function Conteudo({ dados }: { dados: Dados }) {
  const { gerais, nerds, cartas, encalhadas, fatais, escolhas, estresse } = dados
  const dica = useDica()
  const taxa = pct(gerais.vitorias, gerais.total_runs)

  return (
    <div className={styles.analise}>
      <p className={styles.nota}>Contagens de todo mundo, para acompanhar o balanceamento. Nenhum nick aparece aqui.</p>

      <div className={styles.resumo}>
        <Numero rotulo="Partidas terminadas" valor={fmt(gerais.total_runs)} sub={`${fmt(gerais.abandonos)} largadas no meio`} />
        <Numero rotulo="Taxa de vitória" valor={`${taxa}%`} sub={`${fmt(gerais.vitorias)} chegaram ao fim do mês`} destaque />
        <Numero rotulo="Dia médio" valor={gerais.dia_medio != null ? fmt(gerais.dia_medio) : '—'} sub={`de ${regras().diasPorSemana * regras().semanas.length}`} />
        <Numero rotulo="Jogadores" valor={fmt(gerais.jogadores)} sub={`${fmt(gerais.jogadores_que_jogaram)} já jogaram`} />
      </div>

      <div className={styles.grade}>
        <Cartao titulo="Como as partidas acabam" sub="Das partidas terminadas, quantas acabaram em cada desfecho.">
          <Desfechos gerais={gerais} dica={dica} />
          {gerais.abandonos > 0 ? (
            <p className={styles.rodapeCartao}>
              Fora da conta: {fmt(gerais.abandonos)} partidas largadas no meio, a partir do dia 3.
            </p>
          ) : null}
        </Cartao>

        <Cartao titulo="A curva do estresse" sub="O estresse médio no fim de cada dia do mês. Em 10, é burnout.">
          <CurvaDoEstresse dias={estresse} dica={dica} />
        </Cartao>

        <Cartao titulo="Cartas mais jogadas" sub="Somando as partidas de todo mundo.">
          <MaisJogadas cartas={cartas.slice(0, 8)} dica={dica} />
        </Cartao>

        <Cartao titulo="Eventos com escolha" sub="Para que lado o pessoal vai quando o evento deixa escolher.">
          <Escolhas escolhas={escolhas} dica={dica} />
        </Cartao>

        <Cartao titulo="Cartas encalhadas" sub="As que mais ficaram na mão e foram descartadas sem jogar.">
          <Lista
            itens={encalhadas.slice(0, 6).map((c) => ({ chave: c.card_id, nome: nomeDaCarta(c.card_id), vezes: c.vezes }))}
            vazio="Nada descartado ainda."
          />
        </Cartao>

        <Cartao titulo="A carta que mais derruba" sub="A última carta jogada antes de a partida acabar mal.">
          <Lista
            itens={fatais.slice(0, 6).map((f) => ({
              chave: `${f.outcome}-${f.card_id}`,
              nome: nomeDaCarta(f.card_id),
              vezes: f.vezes,
              etiqueta: NOME_DO_DESFECHO[f.outcome],
            }))}
            vazio="Ninguém perdeu ainda."
          />
        </Cartao>
      </div>

      <details className={styles.nerds}>
        <summary>
          <ChevronDown size={18} aria-hidden />
          Para os nerds
          <span>curiosidades de todas as partidas</span>
        </summary>
        <div className={styles.ladrilhos}>
          <Ladrilho rotulo="Cartas jogadas" valor={fmt(nerds.total_cartas_jogadas)} />
          <Ladrilho rotulo="Dias vividos" valor={fmt(nerds.total_dias_vividos)} />
          <Ladrilho rotulo="Maior embalo" valor={nerds.maior_embalo ?? '—'} sub="cartas seguidas do mesmo naipe" />
          <Ladrilho rotulo="Advertências" valor={fmt(nerds.total_advertencias)} />
          <Ladrilho rotulo="Dinheiro somado" valor={<Dinheiro valor={nerds.dinheiro_total} />} />
          <Ladrilho
            rotulo="Energia que sobrou"
            valor={fmt(nerds.energia_desperdicada)}
            sub={nerds.energia_media_sobra != null ? `${nerds.energia_media_sobra} por dia, em média` : undefined}
          />
          <Ladrilho rotulo="Sem descansar" valor={nerds.recorde_sem_descanso ?? '—'} sub="dias seguidos, o recorde" />
          <Ladrilho
            rotulo="Duração média"
            valor={nerds.duracao_media_min != null ? `${nerds.duracao_media_min} min` : '—'}
            sub={nerds.run_mais_rapida_min != null ? `vitória mais rápida: ${nerds.run_mais_rapida_min} min` : undefined}
          />
        </div>
      </details>

      {dica.caixa}
    </div>
  )
}

type DicaApi = ReturnType<typeof useDica>

// ------------------------------------------------------------------ desfechos
/** Uma barra só, dividida: é um todo em partes. O rótulo vai dentro da fatia
 *  só quando cabe; a legenda embaixo sempre traz o número e a porcentagem. */
function Desfechos({ gerais, dica }: { gerais: EstatisticasGerais; dica: DicaApi }) {
  const total = DESFECHOS.reduce((s, d) => s + gerais[d.chave], 0)
  if (total === 0) return <p className={styles.vazio}>Nenhuma partida terminou ainda.</p>
  return (
    <>
      <div className={styles.barraDividida} role="img" aria-label={DESFECHOS.map((d) => `${d.rotulo}: ${gerais[d.chave]}`).join(', ')}>
        {DESFECHOS.filter((d) => gerais[d.chave] > 0).map((d) => {
          const n = gerais[d.chave]
          const p = (n / total) * 100
          return (
            <span
              key={d.chave}
              className={`${styles.fatia} ${styles[d.classe]}`}
              style={{ flexGrow: n }}
              onPointerMove={(e) => dica.mostrar(e, d.rotulo, [[fmt(n), 'partidas'], [`${Math.round(p)}%`, 'do total']])}
              onPointerLeave={dica.esconder}
            >
              {p >= 12 ? `${Math.round(p)}%` : ''}
            </span>
          )
        })}
      </div>
      <ul className={styles.legenda}>
        {DESFECHOS.map((d) => (
          <li key={d.chave}>
            <i className={styles[d.classe]} />
            <span>{d.rotulo}</span>
            <b>{fmt(gerais[d.chave])}</b>
            <span className={styles.fraco}>{pct(gerais[d.chave], total)}%</span>
          </li>
        ))}
      </ul>
    </>
  )
}

// ------------------------------------------------------------------ estresse
function CurvaDoEstresse({ dias, dica }: { dias: EstressePorDia[]; dica: DicaApi }) {
  const [ref, largura] = useLargura<HTMLDivElement>()
  const [foco, setFoco] = useState<number | null>(null)
  if (dias.length === 0) return <p className={styles.vazio}>Sem dias registrados ainda.</p>

  const maximo = regras().estresseMaximo
  const ultimoDia = Math.max(20, ...dias.map((d) => d.day))
  const A = 190
  const m = { esq: 30, dir: 16, cima: 14, baixo: 26 }
  const L = Math.max(0, largura - m.esq - m.dir)
  const H = A - m.cima - m.baixo
  const x = (dia: number) => m.esq + ((dia - 1) / Math.max(1, ultimoDia - 1)) * L
  const y = (v: number) => m.cima + H - (Math.min(v, maximo) / maximo) * H
  const pontos = dias.map((d) => `${x(d.day)},${y(d.estresse_medio)}`).join(' ')
  const area = `${x(dias[0].day)},${y(0)} ${pontos} ${x(dias[dias.length - 1].day)},${y(0)}`
  const ultimo = dias[dias.length - 1]
  const focado = foco !== null ? dias.find((d) => d.day === foco) : null

  function mover(e: React.PointerEvent<SVGRectElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const dia = Math.round(1 + ((e.clientX - r.left) / Math.max(1, r.width)) * (ultimoDia - 1))
    const d = dias.reduce((a, b) => (Math.abs(b.day - dia) < Math.abs(a.day - dia) ? b : a))
    setFoco(d.day)
    dica.mostrar(e, `Dia ${d.day}`, [
      [String(d.estresse_medio).replace('.', ','), 'de estresse médio'],
      [fmt(d.amostras), 'partidas chegaram aqui'],
    ])
  }

  return (
    <>
      <div ref={ref} className={styles.grafico}>
        {largura > 0 ? (
          <svg width={largura} height={A} role="img" aria-label={`Estresse médio por dia, do dia 1 ao ${ultimo.day}`}>
            {[0, 5].map((v) => (
              <g key={v}>
                <line className={styles.grade1px} x1={m.esq} x2={m.esq + L} y1={y(v)} y2={y(v)} />
                <text className={styles.eixo} x={m.esq - 8} y={y(v) + 4} textAnchor="end">{v}</text>
              </g>
            ))}
            {/* o teto: chegar nele é perder */}
            <line className={styles.limite} x1={m.esq} x2={m.esq + L} y1={y(maximo)} y2={y(maximo)} />
            <text className={styles.eixo} x={m.esq - 8} y={y(maximo) + 4} textAnchor="end">{maximo}</text>
            <text className={styles.rotuloLimite} x={m.esq + L} y={y(maximo) - 6} textAnchor="end">burnout</text>
            {[1, 5, 10, 15, 20].filter((d) => d <= ultimoDia).map((d) => (
              <text key={d} className={styles.eixo} x={x(d)} y={A - 6} textAnchor="middle">
                {d === 1 ? 'dia 1' : d}
              </text>
            ))}
            <polygon className={styles.areaEstresse} points={area} />
            <polyline className={styles.linhaEstresse} points={pontos} />
            {focado ? (
              <>
                <line className={styles.mira} x1={x(focado.day)} x2={x(focado.day)} y1={m.cima} y2={m.cima + H} />
                <circle className={styles.pontoEstresse} cx={x(focado.day)} cy={y(focado.estresse_medio)} r={5} />
              </>
            ) : (
              <circle className={styles.pontoEstresse} cx={x(ultimo.day)} cy={y(ultimo.estresse_medio)} r={5} />
            )}
            <rect
              x={m.esq}
              y={m.cima}
              width={L}
              height={H}
              fill="transparent"
              onPointerMove={mover}
              onPointerLeave={() => {
                setFoco(null)
                dica.esconder()
              }}
            />
          </svg>
        ) : null}
      </div>
      <details className={styles.tabela}>
        <summary>Ver os números</summary>
        <table>
          <thead>
            <tr><th>Dia</th><th>Estresse médio</th><th>Partidas</th></tr>
          </thead>
          <tbody>
            {dias.map((d) => (
              <tr key={d.day}><td>{d.day}</td><td>{String(d.estresse_medio).replace('.', ',')}</td><td>{fmt(d.amostras)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  )
}

// ------------------------------------------------------------------ cartas
function MaisJogadas({ cartas, dica }: { cartas: CartaJogada[]; dica: DicaApi }) {
  if (cartas.length === 0) return <p className={styles.vazio}>Ninguém jogou carta nenhuma ainda.</p>
  const teto = cartas[0].vezes
  return (
    <ol className={styles.barras}>
      {cartas.map((c, i) => (
        <li
          key={c.card_id}
          onPointerMove={(e) => dica.mostrar(e, nomeDaCarta(c.card_id), [[fmt(c.vezes), 'vezes jogada'], [`${i + 1}º`, 'no ranking']])}
          onPointerLeave={dica.esconder}
        >
          <span className={styles.nomeBarra}>{nomeDaCarta(c.card_id)}</span>
          <span className={styles.trilho}>
            <span className={styles.barra} style={{ width: `${(c.vezes / teto) * 100}%` }} />
          </span>
          <b>{fmt(c.vezes)}</b>
        </li>
      ))}
    </ol>
  )
}

/** "Happy Hour" e as duas opções dele, com quantas vezes cada uma saiu. */
function Escolhas({ escolhas, dica }: { escolhas: EscolhaDeEvento[]; dica: DicaApi }) {
  const porEvento = new Map<string, [number, number]>()
  for (const e of escolhas) {
    const par = porEvento.get(e.event_id) ?? [0, 0]
    par[e.escolha] += e.vezes
    porEvento.set(e.event_id, par)
  }
  if (porEvento.size === 0) return <p className={styles.vazio}>Nenhuma escolha registrada ainda.</p>
  const linhas = [...porEvento.entries()].sort((a, b) => b[1][0] + b[1][1] - (a[1][0] + a[1][1])).slice(0, 5)
  return (
    <ul className={styles.escolhas}>
      {linhas.map(([id, [a, b]]) => {
        const { nome, opcoes } = opcoesDoEvento(id)
        const total = a + b
        return (
          <li key={id}>
            <span className={styles.nomeEvento}>{nome}</span>
            <span className={styles.barraDividida} role="img" aria-label={`${opcoes[0]}: ${a}, ${opcoes[1]}: ${b}`}>
              {[a, b].map((n, i) =>
                n > 0 ? (
                  <span
                    key={i}
                    className={`${styles.fatia} ${i === 0 ? styles.opcaoA : styles.opcaoB}`}
                    style={{ flexGrow: n }}
                    onPointerMove={(e) => dica.mostrar(e, `${nome} — ${opcoes[i]}`, [[fmt(n), 'vezes'], [`${pct(n, total)}%`, 'das escolhas']])}
                    onPointerLeave={dica.esconder}
                  />
                ) : null,
              )}
            </span>
            <span className={styles.opcoes}>
              <span><i className={styles.opcaoA} />{opcoes[0]} <b>{pct(a, total)}%</b></span>
              <span><i className={styles.opcaoB} />{opcoes[1]} <b>{pct(b, total)}%</b></span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function opcoesDoEvento(id: string): { nome: string; opcoes: [string, string] } {
  try {
    const ev = getEvent(id)
    return { nome: ev.name, opcoes: [ev.choices?.[0]?.label ?? 'Opção 1', ev.choices?.[1]?.label ?? 'Opção 2'] }
  } catch {
    return { nome: id, opcoes: ['Opção 1', 'Opção 2'] }
  }
}

// ------------------------------------------------------------------ peças
function Lista({ itens, vazio }: { itens: { chave: string; nome: string; vezes: number; etiqueta?: string }[]; vazio: string }) {
  if (itens.length === 0) return <p className={styles.vazio}>{vazio}</p>
  return (
    <ol className={styles.lista}>
      {itens.map((it, i) => (
        <li key={it.chave}>
          <span className={styles.posicao}>{i + 1}</span>
          <span className={styles.nomeLista}>{it.nome}</span>
          {it.etiqueta ? <span className={styles.etiqueta}>{it.etiqueta}</span> : null}
          <b>{fmt(it.vezes)}×</b>
        </li>
      ))}
    </ol>
  )
}

function Cartao({ titulo, sub, children }: { titulo: string; sub: string; children: ReactNode }) {
  return (
    <section className={styles.cartao}>
      <header>
        <h2>{titulo}</h2>
        <p>{sub}</p>
      </header>
      {children}
    </section>
  )
}

function Numero({ rotulo, valor, sub, destaque }: { rotulo: string; valor: ReactNode; sub?: string; destaque?: boolean }) {
  return (
    <div className={`${styles.numero} ${destaque ? styles.numeroDestaque : ''}`}>
      <span className={styles.rotulo}>{rotulo}</span>
      <span className={styles.valor}>{valor}</span>
      {sub ? <span className={styles.sub}>{sub}</span> : null}
    </div>
  )
}

function Ladrilho({ rotulo, valor, sub }: { rotulo: string; valor: ReactNode; sub?: string }) {
  return (
    <div className={styles.ladrilho}>
      <span className={styles.rotulo}>{rotulo}</span>
      <span className={styles.valorPequeno}>{valor}</span>
      {sub ? <span className={styles.sub}>{sub}</span> : null}
    </div>
  )
}
