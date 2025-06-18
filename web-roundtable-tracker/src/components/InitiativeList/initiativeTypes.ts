import { Character } from '@/store/data';
import { UUID } from '@/utils/uuid';

export type InitiativeElement =
  | {
      type: 'character';
      element: Character;
    }
  | {
      type: 'roundDisplay';
      element: {
        uuid: string;
      };
    };

export type RoundTimestamps = {
  id: UUID;
  round: number;
  start: number;
  end?: number;
  duration?: number;
};
