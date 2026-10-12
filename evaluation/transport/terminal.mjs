/** User-run TTY only. Never reads environment variables, files, or a secret store. */
import {TransportError} from './http.mjs';
export function hiddenInput(label, {input = process.stdin, output = process.stderr, signal} = {}) {
  if (!input.isTTY || !output.isTTY || typeof input.setRawMode !== 'function') throw new TransportError('interactive-terminal-required');
  if (signal?.aborted) throw new TransportError('user-cancelled');
  return new Promise((resolve, reject) => {
    let value = '', finished = false;
    const wasRaw = input.isRaw, wasPaused = input.isPaused();
    const finish = (error) => {
      if (finished) return;
      finished = true;
      signal?.removeEventListener('abort', onAbort);
      input.removeListener('data', onData); input.removeListener('error', onError); input.removeListener('end', onEnd);
      try { input.setRawMode(wasRaw); } catch {}
      if (wasPaused) input.pause();
      output.write('\n');
      const result = value; value = '';
      if (error) reject(new TransportError(error)); else resolve(result);
    };
    const onAbort = () => finish('user-cancelled');
    const onError = () => finish('terminal-input-failed');
    const onEnd = () => finish('terminal-input-closed');
    const onData = bytes => {
      // A paste containing a newline must never submit a partial key or answer the
      // next question. Only printable ASCII plus backspace and one final Enter.
      const text = Buffer.isBuffer(bytes) ? bytes.toString('utf8') : String(bytes);
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '\u0003' || ch === '\u0004') return finish('user-cancelled');
        if (ch === '\r' || ch === '\n') {
          if (text.slice(i).replace(/[\r\n]/g, '') !== '') return finish('multiline-input-refused');
          return finish();
        }
        if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1);
        else if (ch >= '!' && ch <= '~' || ch === ' ') value += ch;
        else return finish('invalid-terminal-input');
        if (value.length > 8192) return finish('terminal-input-too-long');
      }
    };
    output.write(label);
    signal?.addEventListener('abort', onAbort, {once: true});
    input.on('data', onData); input.once('error', onError); input.once('end', onEnd);
    try { input.setRawMode(true); input.resume(); } catch { finish('terminal-input-failed'); }
    if (signal?.aborted) onAbort();
  });
}
