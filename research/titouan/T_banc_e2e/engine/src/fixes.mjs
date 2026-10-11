// Interrupteurs des correctifs (A/B). POLICY_FIXES = "none" | "all" | "F1,F2,..." ; défaut = liste KEPT (correctifs gardés après mesure).
export const KEPT = [];
export const ALL = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];
const raw = (typeof process !== 'undefined' && process.env && process.env.POLICY_FIXES) || '';
const on = raw === '' ? new Set(KEPT) : raw === 'none' ? new Set() : raw === 'all' ? new Set(ALL) : new Set(raw.split(',').map((s) => s.trim()).filter(Boolean));
export const isOn = (id) => on.has(id);
