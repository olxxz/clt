import { BarChart3, MessageSquareText, Sparkles } from 'lucide-react'

export type Aba = 'novidades' | 'feedbacks' | 'analise'

/** As abas da comunidade. A barra lateral usa a mesma lista no menu que
 *  aparece ao passar o mouse em "Comunidade". */
export const ABAS_DA_COMUNIDADE: { valor: Aba; rotulo: string; texto: string; Icon: typeof Sparkles }[] = [
  { valor: 'novidades', rotulo: 'Novidades', texto: 'O que mudou no jogo, versão por versão.', Icon: Sparkles },
  { valor: 'feedbacks', rotulo: 'Feedbacks', texto: 'Bugs e ideias de quem joga, e as respostas.', Icon: MessageSquareText },
  { valor: 'analise', rotulo: 'Análise', texto: 'Como as partidas de todo mundo estão indo.', Icon: BarChart3 },
]

export function abaValida(v: string | null): Aba {
  return v === 'feedbacks' || v === 'analise' ? v : 'novidades'
}
