// D-MALFORME : calldata that the engine cannot parse because it is structurally broken (out-of-bounds read, V3 path too short,
// truncated ABI words) is a request the wallet cannot show to the user. Fail closed : critical.
// Honest dapps produce calldata through their ABI encoder ; a read past the end of the buffer does not happen by accident.
// The engine tags these `decode_error` (a different code from `unknown_selector`, which only means "not in the registry").
// Objection (a practitioner will make it) : "your decoder may have a bug and refuse a legitimate exotic call". Measured :
// 0 `decode_error` among the 5 927 V2_DEV cases (1 976 benign, many through the Universal Router), so the rule costs nothing
// on benign traffic we know ; if the decoder ever mislabels a legitimate call, the cost is one confirmation, not a loss.
// NIST CSF DE.AE-02, DE.CM-09 ; MITRE ATT&CK T1027 (obfuscated files or information) ; OWASP ASI02 ; D3FEND D3-MAN.
export const malformedCalldata = {
  id: 'malformed_calldata',
  run({ eff }) {
    if (!eff) return null;
    const f = (eff.risk_flags || []).find((r) => r.code === 'decode_error');
    if (!f) return null;
    return { flags: [{ code: 'calldata_malformed', severity: 'critical', detail: `calldata structurellement invalide, non affichable (${String(f.detail || '').slice(0, 90)}) : refus par précaution` }] };
  },
};
