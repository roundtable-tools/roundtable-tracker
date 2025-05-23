import { describe, it, expect, beforeEach } from 'vitest';
import { Event, EventProps } from './Event.class';
import { ReinforcementEvent, ReinforcementEventProps } from './ReinforcementEvent.class';
import { ConditionEvent, ConditionEventProps } from './ConditionEvent.class';
import { Condition } from '@/models/utility/condition/Condition.class';

// Mocks for dependencies
const baseActorProps = { name: 'EventActor' };

describe('Event', () => {
  const props: EventProps = {
    ...baseActorProps,
    description: 'Test event',
    round: 3,
  };
  let event: Event;

  beforeEach(() => {
    event = new Event(props);
  });

  it('should set description and round from props', () => {
    expect(event.description).toBe('Test event');
    expect(event.round).toBe(3);
  });

  it('should have correct label overrides', () => {
    expect(event.pauseLabel).toBe('Disable event');
    expect(event.resumeLabel).toBe('Re-enable event');
    expect(event.startLabel).toBe('Trigger now');
    expect(event.stopLabel).toBe('Revert changes');
    expect(event.beginLabel).toBe('Begin round');
    expect(event.endLabel).toBe('End round');
  });

  it('should have empty pause/resume/start/stop/begin/end methods', () => {
    expect(() => event.pause()).not.toThrow();
    expect(() => event.resume()).not.toThrow();
    expect(() => event.start()).not.toThrow();
    expect(() => event.stop()).not.toThrow();
    expect(() => event.begin()).not.toThrow();
    expect(() => event.end()).not.toThrow();
  });
});

describe('ReinforcementEvent', () => {
  const props: ReinforcementEventProps = {
    ...baseActorProps,
    description: 'Reinforcement event',
    round: 2,
    reinforcementParticipantIds: ['uuid-1', 'uuid-2'],
  };
  let reinforcementEvent: ReinforcementEvent;

  beforeEach(() => {
    reinforcementEvent = new ReinforcementEvent(props);
  });

  it('should set reinforcementParticipantIds from props', () => {
    expect(reinforcementEvent.reinforcementParticipantIds).toEqual(['uuid-1', 'uuid-2']);
  });

  it('should override labels', () => {
    expect(reinforcementEvent.pauseLabel).toBe('Disable event');
    expect(reinforcementEvent.resumeLabel).toBe('Re-enable event');
    expect(reinforcementEvent.startLabel).toBe('Trigger now');
    expect(reinforcementEvent.stopLabel).toBe('Revert changes');
    expect(reinforcementEvent.actLabel).toBe('End round');
  });

  it('should have empty begin method', () => {
    expect(() => reinforcementEvent.begin()).not.toThrow();
  });
});

describe('ConditionEvent', () => {
  const props: ConditionEventProps = {
    ...baseActorProps,
    condition: {} as Condition,
  };
  let conditionEvent: ConditionEvent;

  beforeEach(() => {
    conditionEvent = new ConditionEvent(props);
  });

  it('should set condition from props', () => {
    expect(conditionEvent.condition).toBe(props.condition);
  });

  it('should override labels', () => {
    expect(conditionEvent.pauseLabel).toBe('Disable event');
    expect(conditionEvent.resumeLabel).toBe('Re-enable event');
    expect(conditionEvent.startLabel).toBe('Trigger now');
    expect(conditionEvent.stopLabel).toBe('Revert changes');
    expect(conditionEvent.beginLabel).toBe('Begin round');
    expect(conditionEvent.endLabel).toBe('End round');
  });

  it('should have empty event methods', () => {
    expect(() => conditionEvent.pause()).not.toThrow();
    expect(() => conditionEvent.resume()).not.toThrow();
    expect(() => conditionEvent.start()).not.toThrow();
    expect(() => conditionEvent.stop()).not.toThrow();
    expect(() => conditionEvent.act()).not.toThrow();
  });
});