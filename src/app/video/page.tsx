import Video from './Video'

export const metadata = { title: 'Vídeo — CLT' }

/**
 * O motion graphics do trabalho (v0.48): um minuto e pouco que roda sozinho,
 * fora do jogo e sem guarda de sessão. Linkado do lab. Com `?gravar`, some
 * o controle e o tempo passa a ser dado de fora (`window.__cltTempo`), para
 * gravar quadro a quadro.
 */
export default function VideoPage() {
  return <Video />
}
