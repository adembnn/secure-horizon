// Interrupteurs des correctifs (A/B). POLICY_FIXES = "none" | "all" | "F1,F2,..." ; défaut = liste KEPT (correctifs gardés après mesure).
export const KEPT = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'F13', 'F14', 'F15', 'F16', 'F17', 'F18', 'F19', 'F21', 'F22', 'F23', 'F24', 'F25', 'F26', 'F27', 'F28', 'F29', 'F30', 'F31', 'F32', 'F33']; // F20 annulé (adoucit des fraudes conformes critical->warn)
export const ALL = [...KEPT, ...Array.from({ length: 30 }, (_, i) => 'F' + (11 + i))];
const raw = (typeof process !== 'undefined' && process.env && process.env.POLICY_FIXES) || '';
const on = raw === '' ? new Set(KEPT) : raw === 'none' ? new Set() : raw === 'all' ? new Set(ALL) : new Set(raw.split(',').map((s) => s.trim()).filter(Boolean));
export const isOn = (id) => on.has(id);
