/**
 * Regression tests: Orchestration state machine
 */
import { describe, it, expect } from 'vitest';
import { getInitialOrchestrationState, canTransition } from '@/lib/orchestrationEngine';

describe('canTransition', () => {
  it('allows STARTING → READY', () => {
    expect(canTransition('STARTING', 'READY')).toBe(true);
  });

  it('allows RUNNING → PAUSED', () => {
    expect(canTransition('RUNNING', 'PAUSED')).toBe(true);
  });

  it('allows RUNNING → RESTRICTED', () => {
    expect(canTransition('RUNNING', 'RESTRICTED')).toBe(true);
  });

  it('disallows STARTING → STOPPED', () => {
    expect(canTransition('STARTING', 'STOPPED')).toBe(false);
  });

  it('allows PAUSED → RUNNING', () => {
    expect(canTransition('PAUSED', 'RUNNING')).toBe(true);
  });
});

describe('getInitialOrchestrationState', () => {
  it('starts in STARTING state', () => {
    const state = getInitialOrchestrationState();
    expect(state.systemState).toBe('STARTING');
    expect(state.currentPhase).toBe('INIT');
    expect(state.cycleNumber).toBe(0);
  });

  it('starts with all modules healthy', () => {
    const state = getInitialOrchestrationState();
    expect(state.moduleHealth.every(m => m.status === 'healthy')).toBe(true);
  });

  it('includes all required modules', () => {
    const state = getInitialOrchestrationState();
    const names = state.moduleHealth.map(m => m.name);
    expect(names).toContain('Market Data');
    expect(names).toContain('Execution Sim');
    expect(names).toContain('Governance');
    expect(names).toContain('Risk Manager');
  });

  it('accepts config overrides', () => {
    const state = getInitialOrchestrationState({ cycleIntervalMs: 5000 });
    expect(state.config.cycleIntervalMs).toBe(5000);
  });
});
