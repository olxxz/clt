'use client'

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Coffee,
  Database,
  Droplet,
  Flame,
  FlaskConical,
  Hammer,
  Maximize,
  Monitor,
  TrendingUp,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import Card from '@/components/Card'
import Slider from '@/components/Slider'
import { EVENTO_VITRINE, MAO, VITRINE } from '@/data/vitrine'
import styles from './apresentacao.module.sass'

/**
 * A apresentação é um DIA DE EXPEDIENTE: cada cena é uma folha na mesa, e
 * passar de cena joga a folha de cima para o lado, como quem despacha papel.
 * O relógio de ponto no alto anda das 08:00 às 18:00 conforme as cenas.
 * As cartas são as do jogo (o componente `Card`), com as de `vitrine.ts`.
 *
 * Teclado: → espaço PageDown avançam, ← PageUp voltam, Home/End, F tela cheia.
 * Clique na metade direita avança, na esquerda volta.
 */

/** O atraso de entrada de cada peça da cena, em ordem. */
const d = (n: number) => ({ '--d': `${n * 110}ms` }) as CSSProperties

function Capa() {
  return (
    <div className={styles.capa}>
      <div className={`${styles.logo} ${styles.entra}`} style={d(0)}>
        <Coffee size={54} />
        <Hammer size={54} />
        <Droplet size={54} />
      </div>
      <h1 className={`${styles.carimbo} ${styles.entraCarimbo}`} style={d(3)}>CLT</h1>
      <p className={`${styles.subtitulo} ${styles.entra}`} style={d(5)}>Coffee, Labor and Tears</p>
      <p className={`${styles.frase} ${styles.entra}`} style={d(6)}>
        Atravessar um mês de trabalho sem ficar no vermelho e sem surtar.
      </p>
      <p className={`${styles.autor} ${styles.entra}`} style={d(8)}>
        Luiz Adolfo Frederico · CC4M
      </p>
      <p className={`${styles.dica} ${styles.entra}`} style={d(10)}>
        aperte <kbd>→</kbd> para bater o ponto
      </p>
    </div>
  )
}

function Mes() {
  const semanas = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4']
  return (
    <div className={styles.duasColunas}>
      <div>
        <Rotulo>o jogo</Rotulo>
        <h2 className={`${styles.titulo} ${styles.entra}`} style={d(0)}>Um mês de trabalho formal, numa partida.</h2>
        <ul className={styles.lista}>
          <li className={styles.entra} style={d(2)}><b>Dia</b> é uma rodada: você joga cartas com a energia que tem.</li>
          <li className={styles.entra} style={d(3)}><b>Semana</b> é a cobrança do chefe, e a sexta traz salário e contas.</li>
          <li className={styles.entra} style={d(4)}><b>Mês</b> é a partida inteira: 20 dias.</li>
        </ul>
        <p className={`${styles.nota} ${styles.entra}`} style={d(6)}>Card game roguelike, single player, no navegador.</p>
      </div>
      <div className={styles.calendario} aria-label="Calendário de 4 semanas de 5 dias">
        {semanas.map((s, i) => (
          <div key={s} className={styles.semana}>
            <span>{s}</span>
            {['S', 'T', 'Q', 'Q', 'S'].map((dia, j) => (
              <i key={j} className={`${styles.dia} ${j === 4 ? styles.sexta : ''}`} style={d(2 + i * 5 + j)}>
                {dia}
              </i>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function Conta() {
  const [valor, setValor] = useState(30)
  const estresse = Math.round(valor / 10)
  const energia = 10 - estresse
  return (
    <div className={styles.centro}>
      <Rotulo>a regra que sustenta tudo</Rotulo>
      <h2 className={`${styles.equacao} ${styles.entra}`} style={d(0)}>
        <span style={{ color: 'var(--energia)' }}>Energia</span> = 10 − <span style={{ color: 'var(--estresse)' }}>Estresse</span>
      </h2>
      <div className={`${styles.pips} ${styles.entra}`} style={d(2)} aria-label={`${energia} de energia, ${estresse} de estresse`}>
        {Array.from({ length: 10 }, (_, i) =>
          i < energia ? (
            <Zap key={i} className={styles.pipEnergia} size={34} />
          ) : (
            <Flame key={i} className={styles.pipEstresse} size={34} />
          ),
        )}
      </div>
      <div className={`${styles.regua} ${styles.entra}`} style={d(3)}>
        <span>estresse: <b>{estresse}</b></span>
        <Slider valor={valor} onChange={setValor} passo={10} rotulo="Estresse" />
        <span>energia do dia: <b>{energia}</b></span>
      </div>
      <p className={`${styles.frase} ${styles.entra}`} style={d(5)}>
        O estresse não some sozinho. Um dia mal administrado encolhe todos os dias seguintes.
      </p>
    </div>
  )
}

function Recursos() {
  const itens = [
    { Icone: Zap, nome: 'Energia', cor: 'var(--energia)', texto: 'paga as cartas, e volta cheia todo dia' },
    { Icone: Flame, nome: 'Estresse', cor: 'var(--estresse)', texto: 'acumula de um dia para o outro' },
    { Icone: TrendingUp, nome: 'Produtividade', cor: 'var(--produtividade)', texto: 'é o que o chefe cobra; zera todo dia' },
    { Icone: Banknote, nome: 'Dinheiro', cor: 'var(--dinheiro)', texto: 'acumula, e sai nas contas de sexta' },
  ]
  return (
    <div className={styles.centro}>
      <Rotulo>quatro recursos</Rotulo>
      <h2 className={`${styles.titulo} ${styles.entra}`} style={d(0)}>O que você administra.</h2>
      <div className={styles.recursos}>
        {itens.map(({ Icone, nome, cor, texto }, i) => (
          <div key={nome} className={`${styles.recurso} ${styles.entra}`} style={{ ...d(i + 1), '--cor': cor } as CSSProperties}>
            <Icone size={44} />
            <b>{nome}</b>
            <span>{texto}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Derrotas() {
  const itens = [
    { carimbo: 'Burnout', motivo: 'o estresse chegou a 10' },
    { carimbo: 'Demitido', motivo: 'três advertências do chefe' },
    { carimbo: 'Despejado', motivo: 'não pagou as contas de sexta' },
  ]
  return (
    <div className={styles.centro}>
      <Rotulo>três jeitos de perder</Rotulo>
      <h2 className={`${styles.titulo} ${styles.entra}`} style={d(0)}>E o chefe não espera.</h2>
      <div className={styles.derrotas}>
        {itens.map((x, i) => (
          <div key={x.carimbo} className={styles.derrota}>
            <span className={`${styles.carimboDerrota} ${styles.entraCarimbo}`} style={d(1 + i * 3)}>{x.carimbo}</span>
            <span className={`${styles.motivo} ${styles.entra}`} style={d(2 + i * 3)}>{x.motivo}</span>
          </div>
        ))}
      </div>
      <p className={`${styles.frase} ${styles.entra}`} style={d(11)}>
        Vence quem chega ao fim do mês empregado e com as contas pagas. A pontuação é o dinheiro que sobrou.
      </p>
    </div>
  )
}

function ACarta() {
  return (
    <div className={styles.anatomia}>
      <div>
        <Rotulo>a carta</Rotulo>
        <h2 className={`${styles.titulo} ${styles.entra}`} style={d(0)}>Tudo o que importa cabe em três linhas.</h2>
        <ol className={styles.partes}>
          <li className={styles.entra} style={d(2)}><b>Custo</b> em energia, no canto.</li>
          <li className={styles.entra} style={d(3)}><b>Naipe</b>: tarefa, descanso, grana ou social.</li>
          <li className={styles.entra} style={d(4)}><b>O que faz</b>, escrito a partir das regras da carta.</li>
          <li className={styles.entra} style={d(5)}><b>O comentário</b>, que é onde mora a sátira.</li>
          <li className={styles.entra} style={d(6)}><b>A borda</b> diz a raridade, de comum a lendária.</li>
        </ol>
      </div>
      <div className={`${styles.cartaGrande} ${styles.entraCarta}`} style={d(1)}>
        <Card card={VITRINE.hora} estiloDaArte="rabisco" />
      </div>
    </div>
  )
}

function AMao() {
  return (
    <div className={styles.centro}>
      <Rotulo>um dia na mesa</Rotulo>
      <h2 className={`${styles.titulo} ${styles.entra}`} style={d(0)}>Vira o evento, compra cinco, joga o que a energia deixar.</h2>
      <div className={styles.mesa}>
        <div className={`${styles.evento} ${styles.entraCarta}`} style={d(1)}>
          <Card card={EVENTO_VITRINE} estiloDaArte="rabisco" />
          <span>evento do dia</span>
        </div>
        <div className={styles.leque}>
          {MAO.map((c, i) => (
            <div
              key={c.id}
              className={`${styles.naMao} ${styles.entraMao}`}
              style={{ ...d(3 + i), '--i': i - 2 } as CSSProperties}
            >
              <Card card={c} estiloDaArte="rabisco" />
            </div>
          ))}
        </div>
      </div>
      <p className={`${styles.frase} ${styles.entra}`} style={d(9)}>
        <b>Embalo:</b> cartas seguidas do mesmo naipe rendem mais. A ordem das jogadas importa.
      </p>
    </div>
  )
}

function OPedido() {
  const [depois, setDepois] = useState(true)
  const cartas = [VITRINE.tarefa, VITRINE.terapia, VITRINE.cafeDuplo, VITRINE.chefe, VITRINE.automatizar]
  return (
    <div className={styles.centro}>
      <Rotulo>o que o outro grupo pediu</Rotulo>
      <h2 className={`${styles.titulo} ${styles.entra}`} style={d(0)}>“As cartas podiam ter imagem.”</h2>
      <div className={`${styles.antesDepois} ${styles.entra}`} style={d(1)} role="group" aria-label="Antes e depois">
        <button type="button" aria-pressed={!depois} onClick={(e) => { e.stopPropagation(); setDepois(false) }}>Antes</button>
        <button type="button" aria-pressed={depois} onClick={(e) => { e.stopPropagation(); setDepois(true) }}>Depois</button>
      </div>
      <div className={styles.fileira}>
        {cartas.map((c, i) => (
          <div key={c.id} className={styles.entraCarta} style={d(2 + i)}>
            <Card card={c} estiloDaArte={depois ? 'rabisco' : 'icone'} />
          </div>
        ))}
      </div>
      <ol className={`${styles.processo} ${styles.entra}`} style={d(8)}>
        <li><b>5</b> direções de arte desenhadas</li>
        <li><b>6</b> estilos testados com IA</li>
        <li><b>74</b> rabiscos de caneta, um por carta</li>
        <li>a tinta é a cor da <b>raridade</b></li>
      </ol>
    </div>
  )
}

function ComoFoiFeito() {
  return (
    <div className={styles.centro}>
      <Rotulo>como foi feito</Rotulo>
      <h2 className={`${styles.titulo} ${styles.entra}`} style={d(0)}>As regras não sabem que existe uma tela.</h2>
      <div className={styles.diagrama}>
        <div className={`${styles.caixa} ${styles.caixaMotor} ${styles.entra}`} style={d(1)}>
          <b>src/game</b>
          <span>o motor: funções puras, sem React</span>
        </div>
        <div className={`${styles.setas} ${styles.entra}`} style={d(2)} aria-hidden>
          <i /><i />
        </div>
        <div className={styles.usos}>
          <div className={`${styles.caixa} ${styles.entra}`} style={d(3)}>
            <Monitor size={22} />
            <b>A mesa</b>
            <span>Next + React, no navegador</span>
          </div>
          <div className={`${styles.caixa} ${styles.entra}`} style={d(4)}>
            <FlaskConical size={22} />
            <b>O simulador</b>
            <span>milhares de partidas no terminal</span>
          </div>
        </div>
        <div className={`${styles.caixa} ${styles.caixaBanco} ${styles.entra}`} style={d(5)}>
          <Database size={22} />
          <b>Supabase</b>
          <span>contas, saves, partidas e as cartas — protegido por RLS</span>
        </div>
      </div>
      <ul className={`${styles.chips} ${styles.entra}`} style={d(7)}>
        {['Next 15', 'React 19', 'TypeScript', 'Sass', 'Supabase', 'GitHub Pages'].map((c) => <li key={c}>{c}</li>)}
      </ul>
    </div>
  )
}

function CartaEDado() {
  return (
    <div className={styles.anatomia}>
      <div>
        <Rotulo>carta é dado</Rotulo>
        <h2 className={`${styles.titulo} ${styles.entra}`} style={d(0)}>O motor não conhece nenhuma carta pelo nome.</h2>
        <pre className={`${styles.codigo} ${styles.entra}`} style={d(2)}>
{`efeitos: [{ acoes: [
  { faz: 'recurso', qual: 'dinheiro', quanto: 40 },
  { faz: 'recurso', qual: 'estresse', quanto: 2 },
] }]`}
        </pre>
        <ul className={styles.lista}>
          <li className={styles.entra} style={d(3)}>As cartas moram no <b>banco</b> e se editam num editor em blocos.</li>
          <li className={styles.entra} style={d(4)}>Cada partida guarda <b>como as cartas eram</b> naquele dia.</li>
          <li className={styles.entra} style={d(5)}>Toda mudança fica no histórico, com o motivo.</li>
        </ul>
      </div>
      <div className={`${styles.cartaGrande} ${styles.entraCarta}`} style={d(1)}>
        <Card card={VITRINE.hora} estiloDaArte="rabisco" />
      </div>
    </div>
  )
}

function Balanceamento() {
  const barras = [
    { rotulo: 'Burnout', valor: 98.1, cor: 'var(--estresse)' },
    { rotulo: 'Demissão', valor: 1.2, cor: 'var(--destaque)' },
    { rotulo: 'Vitória', valor: 0.7, cor: 'var(--produtividade)' },
    { rotulo: 'Despejo', valor: 0, cor: 'var(--dinheiro)' },
  ]
  return (
    <div className={styles.duasColunas}>
      <div>
        <Rotulo>balanceamento</Rotulo>
        <h2 className={`${styles.titulo} ${styles.entra}`} style={d(0)}>1000 partidas simuladas. O jogo está duro demais.</h2>
        <p className={`${styles.frase} ${styles.esquerda} ${styles.entra}`} style={d(2)}>
          O bot mediano morre de burnout, quase sempre no dia 5. A espiral é a regra da energia: cota perdida vira
          estresse, que vira menos energia, que perde a cota de novo.
        </p>
        <p className={`${styles.nota} ${styles.entra}`} style={d(3)}>
          Meta decidida: <b>10 a 20%</b> de vitória, mexendo nas regras pelo lab, sem publicar o site.
        </p>
      </div>
      <div className={styles.barras}>
        {barras.map((b, i) => (
          <div key={b.rotulo} className={styles.barra} style={{ '--cor': b.cor, '--v': `${Math.max(b.valor, 0.6)}%`, ...d(2 + i) } as CSSProperties}>
            <span>{b.rotulo}</span>
            <i />
            <b>{b.valor.toLocaleString('pt-BR')}%</b>
          </div>
        ))}
      </div>
    </div>
  )
}

function Numeros() {
  const n = [
    { v: '48', t: 'cartas de ação' },
    { v: '26', t: 'eventos' },
    { v: '20', t: 'dias por partida' },
    { v: '74', t: 'rabiscos' },
    { v: '0.48', t: 'versões publicadas' },
  ]
  return (
    <div className={styles.centro}>
      <Rotulo>até aqui</Rotulo>
      <h2 className={`${styles.titulo} ${styles.entra}`} style={d(0)}>Um mês de jogo, em números.</h2>
      <div className={styles.numeros}>
        {n.map((x, i) => (
          <div key={x.t} className={`${styles.numero} ${styles.entra}`} style={d(i + 1)}>
            <b>{x.v}</b>
            <span>{x.t}</span>
          </div>
        ))}
      </div>
      <p className={`${styles.frase} ${styles.entra}`} style={d(7)}>
        Contas, ranking, amigos, conquistas, missões diárias, recompensas para abrir e um editor de avatar.
      </p>
    </div>
  )
}

function Saida() {
  return (
    <div className={styles.capa}>
      <p className={`${styles.subtitulo} ${styles.entra}`} style={d(0)}>18:00 — fim do expediente</p>
      <h1 className={`${styles.carimbo} ${styles.carimboVerde} ${styles.entraCarimbo}`} style={d(2)}>Obrigado</h1>
      <p className={`${styles.frase} ${styles.entra}`} style={d(4)}>Bata o ponto você também:</p>
      <p className={`${styles.endereco} ${styles.entra}`} style={d(5)}>lx-xz.github.io/clt</p>
      <p className={`${styles.autor} ${styles.entra}`} style={d(7)}>
        Luiz Adolfo Frederico · CC4M
      </p>
    </div>
  )
}

function Rotulo({ children }: { children: ReactNode }) {
  return <span className={`${styles.rotulo} ${styles.entra}`}>{children}</span>
}

const CENAS: { id: string; nome: string; Cena: () => ReactNode }[] = [
  { id: 'capa', nome: 'Capa', Cena: Capa },
  { id: 'mes', nome: 'O jogo', Cena: Mes },
  { id: 'conta', nome: 'Energia = 10 − Estresse', Cena: Conta },
  { id: 'recursos', nome: 'Os recursos', Cena: Recursos },
  { id: 'derrotas', nome: 'As derrotas', Cena: Derrotas },
  { id: 'carta', nome: 'A carta', Cena: ACarta },
  { id: 'mao', nome: 'Um dia na mesa', Cena: AMao },
  { id: 'pedido', nome: 'O pedido do outro grupo', Cena: OPedido },
  { id: 'feito', nome: 'Como foi feito', Cena: ComoFoiFeito },
  { id: 'dado', nome: 'Carta é dado', Cena: CartaEDado },
  { id: 'balanco', nome: 'Balanceamento', Cena: Balanceamento },
  { id: 'numeros', nome: 'Até aqui', Cena: Numeros },
  { id: 'saida', nome: 'Obrigado', Cena: Saida },
]

/** A hora do relógio de ponto na cena `i`: das 08:00 às 18:00. */
function horaDa(i: number) {
  const minutos = Math.round(8 * 60 + (i / (CENAS.length - 1)) * 10 * 60)
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`
}

export default function Apresentacao() {
  const [atual, setAtual] = useState(0)

  const ir = useCallback((i: number) => setAtual(Math.max(0, Math.min(CENAS.length - 1, i))), [])

  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.closest?.('[role="slider"], input, textarea')) return
      if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(e.key)) {
        e.preventDefault()
        setAtual((a) => Math.min(CENAS.length - 1, a + 1))
      } else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) {
        e.preventDefault()
        setAtual((a) => Math.max(0, a - 1))
      } else if (e.key === 'Home') setAtual(0)
      else if (e.key === 'End') setAtual(CENAS.length - 1)
      else if (e.key === 'f' || e.key === 'F') telaCheia()
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [])

  function telaCheia() {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen?.().catch(() => {})
  }

  // clique na mesa: metade direita avança, esquerda volta (não nos controles)
  function clique(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('button, a, [role="slider"], input')) return
    ir(atual + (e.clientX > window.innerWidth / 2 ? 1 : -1))
  }

  return (
    <div className={styles.palco} onClick={clique}>
      <header className={styles.ponto}>
        <span className={styles.relogio} aria-label={`Cena ${atual + 1} de ${CENAS.length}`}>
          <i />
          {horaDa(atual)}
        </span>
        <span className={styles.cartao} aria-hidden>
          {CENAS.map((c, i) => (
            <button
              key={c.id}
              type="button"
              className={i <= atual ? styles.furado : ''}
              title={c.nome}
              onClick={() => ir(i)}
            />
          ))}
        </span>
        <span className={styles.botoes}>
          <button type="button" onClick={() => ir(atual - 1)} disabled={atual === 0} aria-label="Cena anterior">
            <ArrowLeft size={16} />
          </button>
          <button type="button" onClick={() => ir(atual + 1)} disabled={atual === CENAS.length - 1} aria-label="Próxima cena">
            <ArrowRight size={16} />
          </button>
          <button type="button" onClick={telaCheia} aria-label="Tela cheia">
            <Maximize size={16} />
          </button>
          <Link href="/lab" aria-label="Voltar ao lab">sair</Link>
        </span>
      </header>

      {CENAS.map(({ id, nome, Cena }, i) => (
        <section
          key={id}
          aria-label={nome}
          aria-hidden={i !== atual}
          className={`${styles.folha} ${i === atual ? styles.ativa : i < atual ? styles.passada : styles.futura}`}
          style={{ '--giro': `${((i * 37) % 5) - 2}deg`, zIndex: CENAS.length - i } as CSSProperties}
        >
          {/* só a folha de cima monta: as animações de entrada rodam a cada
              vez que ela chega, e as de baixo não pesam */}
          {Math.abs(i - atual) <= 1 ? <Cena /> : null}
        </section>
      ))}

      <p className={styles.rodape} aria-hidden>
        <AlertTriangle size={12} /> números das cartas ilustrativos · o jogo de verdade usa as do banco
      </p>
    </div>
  )
}
