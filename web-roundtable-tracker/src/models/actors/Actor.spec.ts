import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Actor, ActorProps } from './Actor.class';
import { InitiativeParticipant } from '../initiative/InitiativeParticipant.class';

class TestActor extends Actor {
  name: string;
  constructor(props: ActorProps) {
    super(props);
    this.name = props.name || 'Default Name';
  }
}

describe('Actor', () => {
  const props: ActorProps = { name: 'Testy' };
  let actor: TestActor;

  beforeEach(() => {
    actor = new TestActor(props);
  });

  it('should set name from props', () => {
    expect(actor.name).toBe('Testy');
  });

  it('should have default labels', () => {
    expect(actor.pauseLabel).toBe('Pause');
    expect(actor.resumeLabel).toBe('Resume');
    expect(actor.startLabel).toBe('Start');
    expect(actor.stopLabel).toBe('Stop');
    expect(actor.beginLabel).toBe('Begin');
    expect(actor.endLabel).toBe('End');
  });

  it('should log correct message for each method', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    actor.pause();
    actor.resume();
    actor.start();
    actor.stop();
    actor.begin();
    actor.end();

    expect(spy).toHaveBeenCalledWith('Pause: Testy');
    expect(spy).toHaveBeenCalledWith('Resume: Testy');
    expect(spy).toHaveBeenCalledWith('Start: Testy');
    expect(spy).toHaveBeenCalledWith('Stop: Testy');
    expect(spy).toHaveBeenCalledWith('Begin: Testy');
    expect(spy).toHaveBeenCalledWith('End: Testy');
    spy.mockRestore();
  });

  it('should allow parent to be set', () => {
    const parent = {} as InitiativeParticipant ;
    const actorWithParent = new TestActor({ name: 'Child', parent });
    expect(actorWithParent.parent).toBe(parent);
  });
});