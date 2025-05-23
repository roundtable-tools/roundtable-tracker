import { describe, it, expect, vi } from 'vitest';
import { ActivityType } from './Activity';

describe('Activity interface', () => {
  const activity: ActivityType = {
    pause: vi.fn(),
    resume: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    begin: vi.fn(),
    end: vi.fn(),
    pauseLabel: 'Pause',
    resumeLabel: 'Resume',
    startLabel: 'Start',
    stopLabel: 'Stop',
    beginLabel: 'Begin',
    endLabel: 'End',
  };

  it('should have all activity methods as functions', () => {
    expect(typeof activity.pause).toBe('function');
    expect(typeof activity.resume).toBe('function');
    expect(typeof activity.start).toBe('function');
    expect(typeof activity.stop).toBe('function');
    expect(typeof activity.begin).toBe('function');
    expect(typeof activity.end).toBe('function');
  });

  it('should have all activity labels as strings', () => {
    expect(typeof activity.pauseLabel).toBe('string');
    expect(typeof activity.resumeLabel).toBe('string');
    expect(typeof activity.startLabel).toBe('string');
    expect(typeof activity.stopLabel).toBe('string');
    expect(typeof activity.beginLabel).toBe('string');
    expect(typeof activity.endLabel).toBe('string');
  });

  it('should call each method when invoked', () => {
    activity.pause();
    activity.resume();
    activity.start();
    activity.stop();
    activity.begin();
    activity.end();

    expect(activity.pause).toHaveBeenCalled();
    expect(activity.resume).toHaveBeenCalled();
    expect(activity.start).toHaveBeenCalled();
    expect(activity.stop).toHaveBeenCalled();
    expect(activity.begin).toHaveBeenCalled();
    expect(activity.end).toHaveBeenCalled();
  });
});