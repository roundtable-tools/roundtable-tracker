import { InitiativeElement } from './initiativeTypes';
import { Character } from '@/store/data';

export const isCharacter = (
  item: InitiativeElement
): item is InitiativeElement & { type: 'character' } =>
  item.type === 'character';

export const isRoundDisplay = (
  item: InitiativeElement
): item is InitiativeElement & { type: 'roundDisplay' } =>
  item.type === 'roundDisplay';

export function processInitiativeQueueItem(item: InitiativeElement) {
  if (item.type === 'roundDisplay') return 'endRound';

  const character = item.element;

  if (canBeMadeActive(character)) return 'makeActive';

  return 'skip';
}

export function canBeMadeActive(character: Character) {
  if (!character.hasTurn) return false;

  const validStates: Character['turnState'][] = ['active', 'normal', 'delayed'];

  return validStates.includes(character.turnState);
}
