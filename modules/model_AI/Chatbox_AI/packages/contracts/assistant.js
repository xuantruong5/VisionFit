// Shared contract v1. Changes require agreement from frontend and backend owners.
export const CONTRACT_VERSION = 1;
export const MASCOT_STATES = Object.freeze(['idle', 'greeting', 'thinking', 'speaking', 'training', 'celebrating', 'error']);
export const MASCOT_SPECIES = Object.freeze(['bear', 'cat']);
export const EVOLUTION_STAGES = Object.freeze(['starter', 'active', 'strong', 'champion']);
// Future host integration: these events are UI signals, never proof of completed training.
export const HOST_EVENTS = Object.freeze({ start: 'vif:workout-start', pause: 'vif:workout-pause', complete: 'vif:workout-complete' });
export function isMascotState(value) { return MASCOT_STATES.includes(value); }
