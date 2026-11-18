'use client'

import { Banknote, CalendarCheck, Coffee, Droplet, Flame, Gift, Hammer, Layers, Pause, Play, RotateCcw, TrendingUp, Zap } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import Card from '@/components/Card'
import { MAO, VITRINE } from '@/data/vitrine'
import styles from './video.module.sass'

/**
 * O motion graphics: uma LINHA DO TEMPO em que tudo é função do tempo `t`
 * (em segundos). Nenhuma animação de CSS: a posição de cada peça é calculada
 * a cada quadro, e é isso que deixa gravar quadro a quadro (`?gravar`) sem
 * um único engasgo, e voltar para qualquer ponto.
 *
 * O palco é desenhado em 1920×1080 e ESCALADO para caber na janela. As cores
 * são as do tema claro, sempre: o vídeo é uma peça fixa.
 */

const DURACAO = 76

// ------------------------------------------------------------ o tempo
const lim = (x: number) => Math.max(0, Math.min(1, x))
/** De 0 a 1 entre `a` e `b`. */
const p = (t: number, a: number, b: number) => lim((t - a) / (b - a))
const suave = (x: number) => 1 - Math.pow(1 - x, 3)
const vaiVolta = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
/** Passa do ponto e volta: o carimbo que bate. */
const quica = (x: number) => {
  const c = 1.9
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2)
}
const mix = (a: number, b: number, x: number) => a + (b - a) * x

interface Cena {
  de: number
  ate: number
  Desenho: (props: { t: number }) => ReactNode
}

/** A cena aparece e some com um corte suave de 0,35 s. */
function opacidade(t: number, c: Cena) {
  return Math.min(p(t, c.de, c.de + 0.35), 1 - p(t, c.ate - 0.35, c.ate))
}

// ------------------------------------------------------------ cenas
function Abertura({ t }: { t: number }) {
  const icones = [Coffee, Hammer, Droplet]
  const carimbo = p(t, 1.5, 1.9)
  const tremor = carimbo > 0 && carimbo < 1 ? 0 : t > 1.9 && t < 2.2 ? Math.sin(t * 90) * 6 * (1 - p(t, 1.9, 2.2)) : 0
  const texto = 'Coffee, Labor and Tears'
  const letras = Math.round(texto.length * p(t, 2.3, 3.6))
  return (
    <div className={styles.centro} style={{ transform: `translateX(${tremor}px)` }}>
      <div className={styles.logo}>
        {icones.map((I, i) => {
          const x = suave(p(t, 0.2 + i * 0.25, 0.7 + i * 0.25))
          return <I key={i} size={110} style={{ opacity: x, transform: `translateY(${(1 - x) * -120}px)` }} />
        })}
      </div>
      <h1
        className={styles.clt}
        style={{ opacity: lim(carimbo * 3), transform: `scale(${mix(3.2, 1, quica(carimbo))}) rotate(-4deg)` }}
      >
        CLT
      </h1>
      <p className={styles.legenda}>
        {texto.slice(0, letras)}
        <span className={styles.cursor} style={{ opacity: t < 4.4 && Math.floor(t * 3) % 2 === 0 ? 1 : 0 }}>|</span>
      </p>
      <p className={styles.sub} style={{ opacity: p(t, 3.9, 4.5) }}>um card game sobre atravessar o mês</p>
    </div>
  )
}

function Mes({ t }: { t: number }) {
  const t0 = 6
  const dia = Math.min(20, Math.floor(p(t, t0 + 0.6, t0 + 4.8) * 20 + 0.0001))
  return (
    <div className={styles.centro}>
      <h2 className={styles.titulo} style={{ opacity: p(t, t0, t0 + 0.5) }}>Um mês de trabalho.</h2>
      <div className={styles.mes}>
        {Array.from({ length: 20 }, (_, i) => {
          const aceso = i < dia
          const sexta = i % 5 === 4
          return (
            <i
              key={i}
              className={`${styles.dia} ${aceso ? styles.diaAceso : ''} ${aceso && sexta ? styles.diaSexta : ''}`}
              style={{ transform: `scale(${aceso ? mix(1.3, 1, p(t, t0 + 0.6 + i * 0.21, t0 + 0.9 + i * 0.21)) : 1})` }}
            >
              {i + 1}
            </i>
          )
        })}
      </div>
      <p className={styles.legenda} style={{ opacity: p(t, t0 + 5, t0 + 5.6) }}>
        20 dias · 4 cobranças do chefe · 4 sextas de contas
      </p>
    </div>
  )
}

function Equacao({ t }: { t: number }) {
  const t0 = 13
  const estresse = Math.round(7 * vaiVolta(p(t, t0 + 2.2, t0 + 6.2)))
  const energia = 10 - estresse
  return (
    <div className={styles.centro}>
      <h2 className={styles.equacao} style={{ opacity: p(t, t0, t0 + 0.6), transform: `translateY(${(1 - suave(p(t, t0, t0 + 0.8))) * 40}px)` }}>
        <span style={{ color: 'var(--energia)' }}>Energia</span> = 10 − <span style={{ color: 'var(--estresse)' }}>Estresse</span>
      </h2>
      <div className={styles.pips} style={{ opacity: p(t, t0 + 1, t0 + 1.6) }}>
        {Array.from({ length: 10 }, (_, i) =>
          i < energia ? <Zap key={i} size={74} className={styles.pipE} /> : <Flame key={i} size={74} className={styles.pipS} />,
        )}
      </div>
      <div className={styles.placar} style={{ opacity: p(t, t0 + 1.4, t0 + 2) }}>
        <span>estresse <b style={{ color: 'var(--estresse)' }}>{estresse}</b></span>
        <span>energia de amanhã <b style={{ color: 'var(--energia)' }}>{energia}</b></span>
      </div>
      <p className={styles.legenda} style={{ opacity: p(t, t0 + 6.4, t0 + 7) }}>O estresse não some sozinho.</p>
    </div>
  )
}

function Mao({ t }: { t: number }) {
  const t0 = 22
  // a jogada: a Hora Extra sobe da mão e cai no meio da mesa
  const jogada = vaiVolta(p(t, t0 + 4.4, t0 + 5.4))
  const bate = p(t, t0 + 5.4, t0 + 5.7)
  return (
    <div className={styles.mesa}>
      <h2 className={styles.titulo} style={{ opacity: p(t, t0, t0 + 0.5), position: 'absolute', top: 90 }}>
        Compra cinco. Joga o que a energia deixar.
      </h2>
      <div className={styles.baralho} style={{ opacity: p(t, t0, t0 + 0.4) }} />
      {MAO.map((c, i) => {
        const chega = suave(p(t, t0 + 0.8 + i * 0.35, t0 + 1.6 + i * 0.35))
        const ang = (i - 2) * 7
        const xLeque = 960 + (i - 2) * 190
        const yLeque = 800 + Math.abs(i - 2) * 18
        let x = mix(1720, xLeque, chega)
        let y = mix(300, yLeque, chega)
        let r = mix(30, ang, chega)
        let s = 1
        if (c.id === VITRINE.hora.id) {
          x = mix(x, 960, jogada)
          y = mix(y, 470, jogada) - Math.sin(jogada * Math.PI) * 120
          r = mix(r, -3, jogada)
          s = mix(1, 1.35, jogada) * (bate > 0 && bate < 1 ? mix(1.08, 1, bate) : 1)
        }
        return (
          <div
            key={c.id}
            className={styles.cartaSolta}
            style={{ transform: `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${r}deg) scale(${s})`, zIndex: c.id === VITRINE.hora.id ? 9 : i }}
          >
            <div className={styles.zoom}><Card card={c} estiloDaArte="rabisco" /></div>
          </div>
        )
      })}
      <div className={styles.ganhos} style={{ opacity: p(t, t0 + 5.6, t0 + 6) }}>
        <span style={{ color: 'var(--dinheiro)', transform: `translateY(${(1 - suave(p(t, t0 + 5.6, t0 + 6.4))) * 30}px)` }}>
          <Banknote size={46} /> +40
        </span>
        <span style={{ color: 'var(--estresse)', transform: `translateY(${(1 - suave(p(t, t0 + 5.9, t0 + 6.7))) * 30}px)` }}>
          <Flame size={46} /> +2
        </span>
      </div>
    </div>
  )
}

function Embalo({ t }: { t: number }) {
  const t0 = 32
  const cartas = [VITRINE.tarefa, VITRINE.tarefa, VITRINE.automatizar]
  const bonus = ['', '+1', '+2']
  return (
    <div className={styles.centro}>
      <h2 className={styles.titulo} style={{ opacity: p(t, t0, t0 + 0.5) }}>Embalo: o mesmo naipe, em sequência, rende mais.</h2>
      <div className={styles.fileira}>
        {cartas.map((c, i) => {
          const entra = suave(p(t, t0 + 0.8 + i * 1.3, t0 + 1.5 + i * 1.3))
          const pula = p(t, t0 + 1.5 + i * 1.3, t0 + 1.9 + i * 1.3)
          return (
            <div key={i} className={styles.comBonus} style={{ opacity: entra, transform: `translateX(${(1 - entra) * 300}px)` }}>
              <div className={styles.zoom}><Card card={c} estiloDaArte="rabisco" /></div>
              {bonus[i] ? (
                <span className={styles.bonus} style={{ opacity: lim(pula * 3), transform: `scale(${mix(2.4, 1, quica(pula))}) rotate(8deg)` }}>
                  {bonus[i]} <TrendingUp size={40} />
                </span>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Sexta({ t }: { t: number }) {
  const t0 = 39
  const linhas: [string, string, string][] = [
    ['SALÁRIO', '+600', 'var(--dinheiro)'],
    ['ALUGUEL', '−300', 'var(--estresse)'],
    ['CONTAS', '−120', 'var(--estresse)'],
    ['MERCADO', '−90', 'var(--estresse)'],
  ]
  const imprime = suave(p(t, t0 + 0.5, t0 + 3.6))
  const pago = p(t, t0 + 4.2, t0 + 4.6)
  return (
    <div className={styles.centro}>
      <h2 className={styles.titulo} style={{ opacity: p(t, t0, t0 + 0.5) }}>Toda sexta, a conta chega.</h2>
      <div className={styles.recibo} style={{ clipPath: `inset(0 0 ${(1 - imprime) * 100}% 0)` }}>
        <b className={styles.reciboTopo}>SEXTA · SEMANA 1</b>
        {linhas.map(([n, v, cor], i) => (
          <div key={n} className={styles.reciboLinha} style={{ opacity: p(t, t0 + 0.8 + i * 0.6, t0 + 1.1 + i * 0.6) }}>
            <span>{n}</span>
            <span style={{ color: cor }}>{v}</span>
          </div>
        ))}
        <div className={styles.reciboTotal} style={{ opacity: p(t, t0 + 3.4, t0 + 3.8) }}>
          <span>SOBROU</span>
          <span>90</span>
        </div>
        <span className={styles.pago} style={{ opacity: lim(pago * 3), transform: `scale(${mix(3, 1, quica(pago))}) rotate(-14deg)` }}>
          PAGO
        </span>
      </div>
    </div>
  )
}

function Derrotas({ t }: { t: number }) {
  const t0 = 46
  const carimbos = ['BURNOUT', 'DEMITIDO', 'DESPEJADO']
  const giros = [-8, 5, -3]
  return (
    <div className={styles.centro}>
      <h2 className={styles.titulo} style={{ opacity: p(t, t0, t0 + 0.4) }}>Três jeitos de perder.</h2>
      <div className={styles.derrotas}>
        {carimbos.map((c, i) => {
          const x = p(t, t0 + 0.7 + i * 1.1, t0 + 1.05 + i * 1.1)
          return (
            <span
              key={c}
              className={styles.carimbo}
              style={{ opacity: lim(x * 3), transform: `scale(${mix(3, 1, quica(x))}) rotate(${giros[i]}deg)` }}
            >
              {c}
            </span>
          )
        })}
      </div>
      <p className={styles.legenda} style={{ opacity: p(t, t0 + 4.4, t0 + 5) }}>
        Vence quem chega ao fim do mês empregado e com as contas pagas.
      </p>
    </div>
  )
}

function AntesDepois({ t }: { t: number }) {
  const t0 = 52
  const cartas = [VITRINE.tarefa, VITRINE.terapia, VITRINE.cafeDuplo, VITRINE.chefe, VITRINE.automatizar]
  const varre = vaiVolta(p(t, t0 + 2.4, t0 + 5.4))
  return (
    <div className={styles.centro}>
      <p className={styles.sub} style={{ opacity: p(t, t0, t0 + 0.5) }}>o pedido do outro grupo</p>
      <h2 className={styles.titulo} style={{ opacity: p(t, t0 + 0.3, t0 + 0.8) }}>“As cartas podiam ter imagem.”</h2>
      <div className={styles.antesDepois} style={{ opacity: p(t, t0 + 0.8, t0 + 1.4) }}>
        <div className={styles.fileira}>
          {cartas.map((c) => <div key={c.id} className={styles.zoom}><Card card={c} estiloDaArte="icone" /></div>)}
        </div>
        <div className={`${styles.fileira} ${styles.depois}`} style={{ clipPath: `inset(0 ${(1 - varre) * 100}% 0 0)` }}>
          {cartas.map((c) => <div key={c.id} className={styles.zoom}><Card card={c} estiloDaArte="rabisco" /></div>)}
        </div>
        <i className={styles.linhaVarre} style={{ left: `${varre * 100}%`, opacity: varre > 0 && varre < 1 ? 1 : 0 }} />
      </div>
      <p className={styles.legenda} style={{ opacity: p(t, t0 + 5.6, t0 + 6.2) }}>
        74 rabiscos de caneta, um por carta, na cor da raridade.
      </p>
    </div>
  )
}

function Progressao({ t }: { t: number }) {
  const t0 = 61
  const passos = [
    { Icone: CalendarCheck, texto: 'missões do dia' },
    { Icone: Gift, texto: 'recompensas' },
    { Icone: Layers, texto: 'cartas novas' },
  ]
  const raridades: [string, string][] = [
    ['comum', 'var(--selo-comum)'],
    ['incomum', 'var(--raridade-incomum)'],
    ['rara', 'var(--raridade-rara)'],
    ['épica', 'var(--raridade-epica)'],
    ['lendária', 'var(--raridade-lendaria)'],
  ]
  return (
    <div className={styles.centro}>
      <h2 className={styles.titulo} style={{ opacity: p(t, t0, t0 + 0.5) }}>Cada mês deixa o próximo baralho melhor.</h2>
      <div className={styles.passos}>
        {passos.map(({ Icone, texto }, i) => {
          const x = suave(p(t, t0 + 0.6 + i * 0.6, t0 + 1.1 + i * 0.6))
          return (
            <span key={texto} className={styles.passo} style={{ opacity: x, transform: `translateY(${(1 - x) * 40}px)` }}>
              <Icone size={72} />
              {texto}
            </span>
          )
        })}
      </div>
      <div className={styles.chips}>
        {raridades.map(([n, cor], i) => {
          const x = p(t, t0 + 2.6 + i * 0.25, t0 + 2.9 + i * 0.25)
          return (
            <span key={n} style={{ background: cor, opacity: x, transform: `translateY(${(1 - suave(x)) * 30}px)` }}>{n}</span>
          )
        })}
      </div>
    </div>
  )
}

function Fim({ t }: { t: number }) {
  const t0 = 67
  const bate = p(t, t0 + 1.2, t0 + 1.6)
  return (
    <div className={styles.centro}>
      <span className={styles.relogio} style={{ opacity: p(t, t0, t0 + 0.5) }}>18:00</span>
      <h1 className={styles.fim} style={{ opacity: lim(bate * 3), transform: `scale(${mix(2.6, 1, quica(bate))}) rotate(-3deg)` }}>
        Bata o ponto.
      </h1>
      <p className={styles.url} style={{ opacity: p(t, t0 + 2.2, t0 + 2.8) }}>lx-xz.github.io/clt</p>
      <p className={styles.sub} style={{ opacity: p(t, t0 + 3, t0 + 3.6) }}>Luiz Adolfo Frederico · CC4M</p>
    </div>
  )
}

const CENAS: Cena[] = [
  { de: 0, ate: 6, Desenho: Abertura },
  { de: 6, ate: 13, Desenho: Mes },
  { de: 13, ate: 22, Desenho: Equacao },
  { de: 22, ate: 32, Desenho: Mao },
  { de: 32, ate: 39, Desenho: Embalo },
  { de: 39, ate: 46, Desenho: Sexta },
  { de: 46, ate: 52, Desenho: Derrotas },
  { de: 52, ate: 61, Desenho: AntesDepois },
  { de: 61, ate: 67, Desenho: Progressao },
  { de: 67, ate: DURACAO, Desenho: Fim },
]

declare global {
  interface Window {
    /** Só com `?gravar`: põe o vídeo no tempo `t` e espera o quadro pintar. */
    __cltTempo?: (t: number) => Promise<void>
  }
}

export default function Video() {
  const [t, setT] = useState(0)
  const [tocando, setTocando] = useState(true)
  const [gravar, setGravar] = useState(false)
  const [escala, setEscala] = useState(1)
  const inicio = useRef<{ relogio: number; t: number } | null>(null)

  // o vídeo é uma peça fixa: sempre nas cores do tema claro
  useEffect(() => {
    const antes = document.documentElement.dataset.tema
    document.documentElement.dataset.tema = 'claro'
    const g = new URLSearchParams(location.search).has('gravar')
    setGravar(g)
    if (g) {
      setTocando(false)
      window.__cltTempo = (novo) =>
        new Promise((pronto) => {
          setT(novo)
          requestAnimationFrame(() => requestAnimationFrame(() => pronto()))
        })
    }
    return () => {
      if (antes) document.documentElement.dataset.tema = antes
      else delete document.documentElement.dataset.tema
      delete window.__cltTempo
    }
  }, [])

  useEffect(() => {
    const medir = () => setEscala(Math.min(window.innerWidth / 1920, window.innerHeight / 1080))
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [])

  // o relógio: só quando toca (e nunca na gravação, que dá o tempo de fora)
  useEffect(() => {
    if (!tocando) return
    let quadro = 0
    const passo = (agora: number) => {
      if (!inicio.current) inicio.current = { relogio: agora, t }
      const novo = inicio.current.t + (agora - inicio.current.relogio) / 1000
      if (novo >= DURACAO) {
        setT(DURACAO)
        setTocando(false)
        return
      }
      setT(novo)
      quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => {
      cancelAnimationFrame(quadro)
      inicio.current = null
    }
    // o `t` de partida é lido só quando o laço começa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tocando])

  useEffect(() => {
    if (gravar) return
    function tecla(e: KeyboardEvent) {
      if (e.key === ' ') {
        e.preventDefault()
        alternar()
      } else if (e.key === 'ArrowRight') setT((x) => Math.min(DURACAO, x + 5))
      else if (e.key === 'ArrowLeft') setT((x) => Math.max(0, x - 5))
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  })

  function alternar() {
    if (t >= DURACAO) setT(0)
    setTocando((x) => !x)
  }

  return (
    <div className={styles.janela}>
      <div className={styles.palco} style={{ transform: `translate(-50%, -50%) scale(${escala})` } as CSSProperties}>
        {CENAS.map((c, i) => {
          if (t < c.de || t > c.ate) return null
          const { Desenho } = c
          return (
            <div key={i} className={styles.cena} style={{ opacity: opacidade(t, c) }}>
              <Desenho t={t} />
            </div>
          )
        })}
      </div>

      {gravar ? null : (
        <div className={styles.controles}>
          <button type="button" onClick={alternar} aria-label={tocando ? 'Pausar' : 'Tocar'}>
            {tocando ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button type="button" onClick={() => { setT(0); setTocando(true) }} aria-label="Do começo">
            <RotateCcw size={16} />
          </button>
          <input
            type="range"
            min={0}
            max={DURACAO}
            step={0.1}
            value={t}
            onChange={(e) => { setTocando(false); setT(Number(e.target.value)) }}
            aria-label="Tempo do vídeo"
          />
          <span>{Math.floor(t)}s / {DURACAO}s</span>
          <Link href="/lab">sair</Link>
        </div>
      )}
    </div>
  )
}
