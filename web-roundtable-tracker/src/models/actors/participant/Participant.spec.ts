import { describe, it, expect, beforeEach } from 'vitest';
import { Participant, ParticipantProps } from './Participant.class';
import { HitPoints } from '@/models/utility/hitPoints/HitPoints.class';
import { Statblock } from '@/models/utility/statblock/Statblock.class';

// Mock dependencies

describe('Participant', () => {
  let props: ParticipantProps;
  let participant: Participant;

  beforeEach(() => {
    props = {
      name: 'Test Participant',
      currentRound: 1,
      level: 5,
      initiativeTieBreakerMode: 2,
      hitPoints: {} as HitPoints,
      statblock: {} as Statblock,
    };
    participant = new Participant(props);
  });

  it('should set properties from props', () => {
    expect(participant.name).toBe('Test Participant');
    expect(participant.level).toBe(5);
    expect(participant.initiativeTieBreakerMode).toBe(2);
    expect(participant.hitPoints).toBe(props.hitPoints);
    expect(participant.statblock).toBe(props.statblock);
    expect(participant.currentRound).toBe(1);
  });

  it('should have correct label overrides', () => {
    expect(participant.pauseLabel).toBe('Delay turn');
    expect(participant.resumeLabel).toBe('Re-enter initiative');
    expect(participant.startLabel).toBe('K.O.');
    expect(participant.stopLabel).toBe('Recover');
    expect(participant.beginLabel).toBe('Turn start');
    expect(participant.endLabel).toBe('End turn');
  });

  it('should initialize roundDurations as empty array', () => {
    expect(Array.isArray(participant.roundDurations)).toBe(true);
    expect(participant.roundDurations.length).toBe(0);
  });

  it('should have empty pause/resume/start/stop/begin/end methods', () => {
    // These should not throw
    expect(() => participant.pause()).not.toThrow();
    expect(() => participant.resume()).not.toThrow();
    expect(() => participant.start()).not.toThrow();
    expect(() => participant.stop()).not.toThrow();
    expect(() => participant.begin()).not.toThrow();
    expect(() => participant.end()).not.toThrow();
  });
});