const out = document.getElementById('out');
const input = document.getElementById('in');
const form = document.getElementById('line');
const PROMPT = 'visitor69@unikorm:~$ ';

// A line is { spans: [{ text, tone }] }. Commands return lines, never HTML.
const L = (text, tone) => ({ spans: [{ text, tone }] });

const commands = {
  help: () => [
    L("help doesn't come here", 'dim'),
  ],
  clear: () => { out.replaceChildren(); return []; },
  whoami: () => [L('nobody')],
};

function print(lines) {
  for (const line of lines) {
    const el = document.createElement('div');
    for (const span of line.spans) {
      const s = document.createElement('span');
      s.textContent = span.text;
      if (span.tone) s.className = span.tone;
      el.append(s);
    }
    out.append(el);
  }
}

function run(raw) {
  const [cmd, ...args] = raw.trim().split(/\s+/);
  if (!cmd) return [];
  const fn = commands[cmd];
  if (!fn) return [
    L(`bash: ${cmd}: command not found`),
  ];
  return fn(args);
}

// history: arrow keys walk previous commands, in memory only
const history = [];
let cursor = 0;

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const raw = input.value;
  input.value = '';
  print([{ spans: [{ text: PROMPT, tone: 'dim' }, { text: raw }] }]);
  if (raw.trim()) history.push(raw);
  cursor = history.length;
  print(run(raw));
  input.scrollIntoView({ block: 'end' });
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' && cursor > 0) {
    cursor--;
    input.value = history[cursor];
    e.preventDefault();
  } else if (e.key === 'ArrowDown') {
    cursor = Math.min(cursor + 1, history.length);
    input.value = history[cursor] ?? '';
    e.preventDefault();
  }
});

// tapping anywhere in the terminal focuses the input
document.addEventListener('click', () => input.focus());

print([
]);
input.focus();
