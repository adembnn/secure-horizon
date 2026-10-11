/* Hold up - "Ce que j'ai compris" : the question screen reads the sentence as the person types, with the same code as the check
 * (intent_text.js : the fields of the sentence, and the embedded keyword classifier for its kind). Read only.
 * Runs in the window page only. Nothing is sent, nothing is stored. */
import { KINDS, extractFields, keywordClassify } from '../intent_text.js';
window.HoldupFields = extractFields;
window.HoldupKind = async (text) => { try { const r = await keywordClassify(text); return r && KINDS.includes(r.kind) ? r.kind : null; } catch (_) { return null; } };
