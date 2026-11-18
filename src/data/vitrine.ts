import type { ActionCard, EventCard } from '@/game/types'

/**
 * Cartas de EXEMPLO para a apresentação e o vídeo (v0.48), que abrem fora
 * do jogo e sem banco: são cópias da última versão das cartas em código
 * (v0.38), com os ids de verdade — é o id que traz o rabisco de cada uma.
 * Os números podem estar atrás do balanceamento do banco, e tudo bem: aqui
 * elas só ilustram. Para jogar, o catálogo continua sendo o do banco.
 */
export const VITRINE: Record<string, ActionCard> = {
  tarefa: {
    id: 'ced5bff1-3c5e-5aaa-ac5c-5783d18e3d43', name: 'Tarefa Simples', cost: 3, starter: false, kind: 'tarefa',
    text: 'Igual à de ontem.',
    efeitos: [{ acoes: [{ faz: 'recurso', qual: 'produtividade', quanto: 2 }] }],
  },
  cafe: {
    id: '49efebc8-f8b2-5495-ad28-472e360fc73b', name: 'Café', cost: 0, starter: false, kind: 'descanso',
    text: 'O terceiro do dia. Ninguém está contando.',
    efeitos: [{ acoes: [
      { faz: 'recurso', qual: 'energia', quanto: 3 },
      { faz: 'recurso', qual: 'estresse', quanto: 1 },
    ] }],
  },
  hora: {
    id: 'bea0a018-64c8-57a7-a8df-c33aa2248983', name: 'Hora Extra', cost: 3, starter: false, kind: 'grana',
    text: 'O ônibus das 23h passa às 23h07.',
    efeitos: [{ acoes: [
      { faz: 'recurso', qual: 'dinheiro', quanto: 40 },
      { faz: 'recurso', qual: 'estresse', quanto: 2 },
    ] }],
  },
  cafeDuplo: {
    id: '3c966c34-0f22-508a-8978-42171eb8cac8', raridade: 'rara', name: 'Café Duplo', cost: 0, starter: false, kind: 'descanso',
    text: 'Um para acordar, outro para continuar acordado.',
    efeitos: [{ acoes: [
      { faz: 'recurso', qual: 'energia', quanto: 5 },
      { faz: 'recurso', qual: 'estresse', quanto: 2 },
    ] }],
  },
  terapia: {
    id: '94f7cd08-7416-5cca-a1f3-e8df57c40061', raridade: 'incomum', name: 'Terapia', cost: 0, starter: false,
    custos: [{ qual: 'dinheiro', quanto: 80 }], kind: 'descanso',
    text: 'Cinquenta minutos falando do chefe.',
    efeitos: [{ acoes: [{ faz: 'recurso', qual: 'estresse', quanto: -3 }] }],
  },
  mentoria: {
    id: 'e4aa88ea-adb1-5063-af2a-5dbe64e73d29', raridade: 'incomum', name: 'Mentoria', cost: 2, starter: false, kind: 'social',
    text: 'Alguém finalmente explicou o sistema.',
    efeitos: [{ acoes: [{ faz: 'comprar', quantas: 2 }] }],
  },
  automatizar: {
    id: '8b0bba55-009c-599c-98e2-fef03ebe7e79', raridade: 'lendaria', name: 'Automatizar', cost: 5, starter: false, kind: 'tarefa',
    text: 'O script faz o seu trabalho. Ninguém precisa saber.',
    efeitos: [{ acoes: [
      { faz: 'recurso', qual: 'produtividade', quanto: 2 },
      { faz: 'recorrente', qual: 'produtividade', quanto: 1, cada: 'dia' },
    ] }],
  },
  chefe: {
    id: '8eeef200-50fb-5448-aab8-e4c70ac129cb', raridade: 'epica', name: 'Café com o Chefe', cost: 2, starter: false, kind: 'social',
    text: 'Ele paga. Você escuta.',
    efeitos: [{ acoes: [{ faz: 'recurso', qual: 'produtividade', quanto: 1 }, { faz: 'recurso', qual: 'estresse', quanto: -1 }] }],
  },
}

export const EVENTO_VITRINE: EventCard = {
  id: 'fe92514c-a55e-5017-9826-d5d8662d4423', name: 'Chefe de Mau Humor', tone: 'negativo',
  text: '+2 estresse',
  efeitos: [{ acoes: [{ faz: 'recurso', qual: 'estresse', quanto: 2 }] }],
}

/** A mão de exemplo, na ordem do leque. */
export const MAO = [VITRINE.tarefa, VITRINE.cafe, VITRINE.hora, VITRINE.mentoria, VITRINE.automatizar]
