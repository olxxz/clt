'use client'

import { useSyncExternalStore } from 'react'

/**
 * O que a área de arte da carta mostra (v0.48): o ícone da classe, como
 * sempre foi, o RABISCO de caneta ou a COLAGEM de papelaria. É escolha de
 * quem joga, em Configurações › Aparência, e só muda o desenho: a carta é a
 * mesma nos três.
 *
 * As imagens moram em `src/data/artes/`, uma por carta e por estilo,
 * pelo id da carta. Carta sem imagem (criada no `/lab` depois) cai no ícone.
 */
export type EstiloDaArte = 'icone' | 'rabisco' | 'colagem'

export const ESTILOS_DA_ARTE: { valor: EstiloDaArte; rotulo: string }[] = [
  { valor: 'colagem', rotulo: 'Colagem' },
  { valor: 'rabisco', rotulo: 'Rabisco' },
  { valor: 'icone', rotulo: 'Ícone' },
]

/** A colagem é o padrão: foi o pedido de quem jogou, "imagem na carta". */
export const ESTILO_PADRAO: EstiloDaArte = 'colagem'

// com HÍFEN, e não `clt:`: `limparLocalDoJogo` apaga o que começa com `clt:`
// a cada saída e troca de conta, e isto é preferência do aparelho, não de
// quem está jogando (a mesma razão de `clt-contas:v1`)
const CHAVE = 'clt-arte:v1'
const EVENTO = 'clt:arte'

function valido(v: unknown): v is EstiloDaArte {
  return v === 'icone' || v === 'rabisco' || v === 'colagem'
}

export function lerEstiloDaArte(): EstiloDaArte {
  if (typeof window === 'undefined') return ESTILO_PADRAO
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    return valido(bruto) ? bruto : ESTILO_PADRAO
  } catch {
    return ESTILO_PADRAO
  }
}

export function gravarEstiloDaArte(estilo: EstiloDaArte) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CHAVE, estilo)
  } catch {
    // sem storage a escolha só não é lembrada na próxima visita; o evento
    // abaixo ainda troca as cartas desta
  }
  memoria = estilo
  window.dispatchEvent(new CustomEvent(EVENTO))
}

// sem storage, a escolha da visita mora aqui
let memoria: EstiloDaArte | null = null

function assinar(avisar: () => void) {
  const daOutraAba = (e: StorageEvent) => {
    if (e.key === CHAVE) avisar()
  }
  window.addEventListener(EVENTO, avisar)
  window.addEventListener('storage', daOutraAba)
  return () => {
    window.removeEventListener(EVENTO, avisar)
    window.removeEventListener('storage', daOutraAba)
  }
}

/** O estilo de agora, e a carta se redesenha quando ele muda. No build (e
 *  no primeiro quadro da hidratação) é o padrão, para o HTML bater. */
export function useEstiloDaArte(): EstiloDaArte {
  return useSyncExternalStore(
    assinar,
    () => {
      const lido = lerEstiloDaArte()
      return memoria && lido === ESTILO_PADRAO ? memoria : lido
    },
    () => ESTILO_PADRAO,
  )
}
