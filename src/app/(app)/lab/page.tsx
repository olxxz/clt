'use client'

import {
  ChevronRight,
  ClipboardCopy,
  Clapperboard,
  Dices,
  Download,
  FlaskConical,
  Gift,
  Landmark,
  Layers,
  Mail,
  Presentation,
  RotateCcw,
  Shirt,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Unlock,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import BotaoConfirmar from '@/components/BotaoConfirmar'
import Dialogo from '@/components/Dialogo'
import { useSessao } from '@/components/SessaoGuard'
import { cartasDoJogo, todasAsCartas, todosOsEventos, versaoDoBaralho } from '@/game/catalogo'
import { NOMES_DE_RARIDADE, baralhoAtivo, cartasDoBaralho, copiasMaximas } from '@/game/colecao'
import { regras } from '@/game/regras'
import { COSMETICOS } from '@/game/cosmeticos'
import { clearRun, defaultCollection, loadCollection, saveCollection } from '@/game/storage'
import { enviarPresente } from '@/data/presentes'
import { sincronizar } from '@/data/sync'
import buttons from '@/styles/buttons.module.sass'
import styles from './lab.module.sass'

interface Bancada {
  href: string
  titulo: string
  texto: string
  Icon: LucideIcon
}

// as bancadas em três prateleiras, pelo que se faz nelas: mexer no jogo que
// está no ar, experimentar, e mostrar o jogo para os outros
const GRUPOS: { titulo: string; texto: string; bancadas: Bancada[] }[] = [
  {
    titulo: 'O jogo no ar',
    texto: 'Grava direto no banco: vale para a próxima partida de todo mundo.',
    bancadas: [
      { href: '/lab/cartas', titulo: 'Cartas de ação', texto: 'Criar, editar e remover, com o motivo no histórico.', Icon: Layers },
      { href: '/lab/eventos', titulo: 'Cartas de evento', texto: 'Os eventos do dia, escolhas dos ambíguos inclusas.', Icon: Shuffle },
      { href: '/lab/regras', titulo: 'Regras do jogo', texto: 'Aluguel, cota, salário e energia base.', Icon: SlidersHorizontal },
    ],
  },
  {
    titulo: 'Bancada de testes',
    texto: 'Protótipos e comparações. Nada daqui muda o jogo.',
    bancadas: [
      { href: '/lab/envelopes', titulo: 'Recompensas', texto: 'Abrir de verdade, e o que sai em mil aberturas.', Icon: Mail },
      { href: '/lab/sorte', titulo: 'Cartas de sorte', texto: 'Barra, moeda, dado e a sorte tirada na mesa.', Icon: Dices },
      // a proposta anterior (/lab/propostas) mora no museu, guardada de
      // recordação, a pedido do autor
      { href: '/lab/museu', titulo: 'Museu', texto: 'As versões de antes, para comparar.', Icon: Landmark },
    ],
  },
  {
    titulo: 'Apresentação',
    texto: 'Para mostrar o CLT em tela cheia. Abrem fora do jogo, sem a barra lateral.',
    bancadas: [
      { href: '/apresentacao', titulo: 'Apresentação', texto: 'O jogo contado em cenas, com as setas do teclado.', Icon: Presentation },
      { href: '/video', titulo: 'Vídeo', texto: 'O motion graphics: um minuto e meio que roda sozinho.', Icon: Clapperboard },
    ],
  },
]

type Ferramenta = 'simulador' | 'presente' | 'atalhos'

const FERRAMENTAS: { id: Ferramenta; titulo: string; texto: string; Icon: LucideIcon }[] = [
  { id: 'simulador', titulo: 'Simulador', texto: 'O jogo no ar num arquivo, para milhares de partidas.', Icon: FlaskConical },
  { id: 'presente', titulo: 'Presente', texto: 'Dar uma carta a um jogador, com recado.', Icon: Gift },
  { id: 'atalhos', titulo: 'Atalhos de teste', texto: 'Desbloquear e resetar a SUA conta.', Icon: Wrench },
]

/**
 * A porta do lab (refeita na v0.48): as bancadas em grupos, e as três
 * ferramentas (simulador, presente, atalhos) em popups. Os atalhos de teste
 * **mudam o SEU jogo** — e é por isso que eles são de admin: com a coleção inteira desbloqueada, um relato de "o jogo está
 * fácil" não diz mais nada, e num ranking com todo mundo junto isso seria
 * vantagem.
 */
export default function LabPage() {
  const sessao = useSessao()
  const [aberta, setAberta] = useState<Ferramenta | null>(null)
  const [recado, setRecado] = useState<string | null>(null)

  function abrir(f: Ferramenta) {
    setRecado(null)
    setAberta(f)
  }

  function desbloquearTudo() {
    // todas as cartas, no teto de cópias; os baralhos montados não mudam
    const colecao = loadCollection()
    const todas = cartasDoJogo()
    const nova = { ...colecao, tenho: Object.fromEntries(todas.map((c) => [c.id, copiasMaximas(c)])) }
    saveCollection(nova)
    sincronizar(sessao.id, null, nova, () => {})
    setRecado(`Coleção com as ${todas.length} cartas, cada uma no teto de cópias. Os baralhos não mudaram.`)
  }

  function desbloquearCosmeticos() {
    // todas as peças da tabela, as sazonais inclusive; o avatar vestido não muda
    const colecao = loadCollection()
    const nova = { ...colecao, cosmeticos: [...new Set([...colecao.cosmeticos, ...COSMETICOS.map((c) => c.id)])] }
    saveCollection(nova)
    sincronizar(sessao.id, null, nova, () => {})
    setRecado(`Os ${COSMETICOS.length} cosméticos estão na sua coleção. O avatar vestido não mudou.`)
  }

  function resetar() {
    // a run em andamento e a coleção voltam ao começo. O histórico de partidas
    // NÃO é apagado: ele é append-only no banco de propósito, e some daqui
    // seria mentir sobre o balanceamento.
    clearRun()
    const nova = defaultCollection()
    saveCollection(nova)
    sincronizar(sessao.id, null, nova, () => {})
    setRecado('Run e coleção zeradas. As partidas já terminadas continuam no histórico.')
  }

  /**
   * O jogo como ele está NO AR, num arquivo: as cartas e os eventos do
   * banco, as regras do modo e o baralho equipado desta conta. É o que o
   * `npm run simular -- --de arquivo.json` lê, e o simulador não roda sem
   * ele: as cartas só moram no banco.
   */
  function dadosParaOSimulador(): string {
    const colecao = loadCollection()
    const ativo = baralhoAtivo(colecao)
    return JSON.stringify(
      {
        geradoEm: new Date().toISOString(),
        versao: versaoDoBaralho(),
        modo: regras(),
        baralho: { nome: ativo.nome, cartas: cartasDoBaralho(ativo) },
        cartas: todasAsCartas(),
        eventos: todosOsEventos(),
      },
      null,
      1,
    )
  }

  async function copiarParaOSimulador() {
    try {
      await navigator.clipboard.writeText(dadosParaOSimulador())
      setRecado('Copiado: cartas, eventos, regras e o seu baralho equipado. Cole na conversa.')
    } catch {
      setRecado('O navegador não deixou copiar. Use o “Baixar arquivo”.')
    }
  }

  function baixarParaOSimulador() {
    const url = URL.createObjectURL(new Blob([dadosParaOSimulador()], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `clt-simulador-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const recadoNaTela = recado ? (
    <p className={styles.recado}>
      <Sparkles size={14} aria-hidden />
      {recado}
    </p>
  ) : null

  return (
    <main className={`page ${styles.lab}`}>
      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Lab</h1>
        <p className={styles.intro}>
          A oficina do CLT. O que está aqui em cima grava no banco e vale no jogo; o resto é bancada de teste.
        </p>
      </header>

      {GRUPOS.map((g) => (
        <section key={g.titulo} className={styles.grupo}>
          <div className={styles.grupoCabeca}>
            <h2 className={styles.secao}>{g.titulo}</h2>
            <p className={styles.aviso}>{g.texto}</p>
          </div>
          <div className={styles.bancadas}>
            {g.bancadas.map(({ href, titulo, texto, Icon }) => (
              <Link key={href} className={styles.bancada} href={href}>
                <span className={styles.icone}>
                  <Icon size={20} aria-hidden />
                </span>
                <b>{titulo}</b>
                <span className={styles.texto}>{texto}</span>
                <ChevronRight className={styles.seta} size={18} aria-hidden />
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className={styles.grupo}>
        <div className={styles.grupoCabeca}>
          <h2 className={styles.secao}>Ferramentas</h2>
          <p className={styles.aviso}>Abrem num popup, sem sair daqui.</p>
        </div>
        <div className={styles.ferramentas}>
          {FERRAMENTAS.map(({ id, titulo, texto, Icon }) => (
            <button key={id} type="button" className={styles.ferramenta} onClick={() => abrir(id)}>
              <Icon size={22} aria-hidden />
              <b>{titulo}</b>
              <span>{texto}</span>
            </button>
          ))}
        </div>
      </section>

      <Dialogo
        aberto={aberta === 'simulador'}
        titulo="Simulador"
        onFechar={() => setAberta(null)}
        acoes={
          <>
            <button type="button" className={`${buttons.button} ${buttons.primary}`} onClick={() => void copiarParaOSimulador()}>
              <ClipboardCopy size={15} aria-hidden />
              Copiar
            </button>
            <button type="button" className={buttons.button} onClick={baixarParaOSimulador}>
              <Download size={15} aria-hidden />
              Baixar arquivo
            </button>
          </>
        }
      >
        <p className={styles.dialogoTexto}>
          O jogo como está no ar — cartas, eventos, regras e o seu baralho equipado — num arquivo. É o que o{' '}
          <code>npm run simular -- --de arquivo.json</code> lê para medir o balanceamento com milhares de partidas fora do
          navegador.
        </p>
        {recadoNaTela}
      </Dialogo>

      <Dialogo aberto={aberta === 'presente'} titulo="Presente" onFechar={() => setAberta(null)}>
        <p className={styles.dialogoTexto}>
          Dá uma carta a um jogador. Ela aparece no início dele, num envelope para abrir, com o seu recado. Convidado não
          recebe.
        </p>
        <EnviarPresente />
      </Dialogo>

      <Dialogo aberto={aberta === 'atalhos'} titulo="Atalhos de teste" onFechar={() => setAberta(null)}>
        <p className={styles.dialogoTexto}>
          Mexem na <b>sua</b> conta de verdade, agora — e estragam qualquer leitura de dificuldade que venha dela. Cada um
          pede um segundo clique para confirmar.
        </p>
        <div className={styles.atalhos}>
          <div className={styles.atalho}>
            <div>
              <b>Todas as cartas</b>
              <span>Entram na coleção no teto de cópias, fora do baralho.</span>
            </div>
            <BotaoConfirmar className={buttons.button} armado="Confirmar" onConfirmar={desbloquearTudo}>
              <Unlock size={15} aria-hidden /> Desbloquear
            </BotaoConfirmar>
          </div>
          <div className={styles.atalho}>
            <div>
              <b>Todos os cosméticos</b>
              <span>As peças de avatar, as de Halloween inclusive. A máquina passa a dar só repetidas.</span>
            </div>
            <BotaoConfirmar className={buttons.button} armado="Confirmar" onConfirmar={desbloquearCosmeticos}>
              <Shirt size={15} aria-hidden /> Desbloquear
            </BotaoConfirmar>
          </div>
          <div className={styles.atalho}>
            <div>
              <b>Resetar run e coleção</b>
              <span>As partidas terminadas ficam no histórico: ele é append-only de propósito.</span>
            </div>
            <BotaoConfirmar className={buttons.button} armado="Resetar mesmo" onConfirmar={resetar}>
              <RotateCcw size={15} aria-hidden /> Resetar
            </BotaoConfirmar>
          </div>
        </div>
        {recadoNaTela}
      </Dialogo>
    </main>
  )
}

/**
 * O presente do admin (v0.40). Quem confere se é admin é o banco
 * (`admin_enviar_presente`); a carta chega pelo site de quem recebe, no
 * início (`components/Presentes`).
 */
function EnviarPresente() {
  const cartas = [...cartasDoJogo()].sort((a, b) => a.name.localeCompare(b.name, 'pt'))
  const [nick, setNick] = useState('')
  const [carta, setCarta] = useState(cartas[0]?.id ?? '')
  const [mensagem, setMensagem] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [recado, setRecado] = useState<{ ok: boolean; texto: string } | null>(null)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setOcupado(true)
    setRecado(null)
    const r = await enviarPresente(nick.trim(), carta, mensagem)
    setOcupado(false)
    if (!r.ok) return setRecado({ ok: false, texto: r.erro ?? 'Não deu para enviar.' })
    const nome = cartas.find((c) => c.id === carta)?.name ?? 'A carta'
    setRecado({ ok: true, texto: `${nome} foi para ${nick.trim()}. Aparece na próxima vez que abrir o início.` })
    setMensagem('')
  }

  return (
    <form className={styles.presente} onSubmit={(e) => void enviar(e)}>
      <input
        className={styles.campo}
        value={nick}
        onChange={(e) => setNick(e.target.value)}
        placeholder="nick de quem recebe"
        aria-label="Nick de quem recebe"
        autoCapitalize="none"
        spellCheck={false}
        required
      />
      <select className={styles.campo} value={carta} onChange={(e) => setCarta(e.target.value)} aria-label="Carta">
        {cartas.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} · {NOMES_DE_RARIDADE[c.raridade ?? 'comum']}
          </option>
        ))}
      </select>
      <input
        className={styles.campo}
        value={mensagem}
        onChange={(e) => setMensagem(e.target.value)}
        placeholder="recado (opcional)"
        aria-label="Recado"
        maxLength={200}
      />
      <button type="submit" className={`${buttons.button} ${buttons.primary}`} disabled={ocupado || !nick.trim() || !carta}>
        <Gift size={15} aria-hidden /> {ocupado ? 'Enviando…' : 'Enviar presente'}
      </button>
      {recado ? <p className={recado.ok ? styles.recado : styles.erro}>{recado.texto}</p> : null}
    </form>
  )
}
