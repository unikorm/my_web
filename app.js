// The only file that touches the DOM. Reads a line, runs it, prints lines.

import { commands } from './core/commands.js';
import { HOME, get, read, short } from './core/fs.js';

const out = document.getElementById('out');
const input = document.getElementById('in');
const form = document.getElementById('line');
const label = document.querySelector('.prompt');

// session state. commands may change cwd, history and aliases; nothing else.
const ctx = {
  user: 'visitor69',
  host: 'unikorm',
  cwd: HOME,
  prev: HOME,
  env: {
    USER: 'visitor69', HOME, SHELL: '/bin/bash', PATH: '/usr/local/bin:/usr/bin:/bin',
    TERM: 'xterm-256color', HOSTNAME: 'unikorm.eu', LANG: 'en_US.UTF-8', EDITOR: 'vim',
  },
  history: [],
  aliases: {},
  clear: () => out.replaceChildren(),
  theme: (name) => { document.documentElement.dataset.theme = name; },
};

// source ~/.bashrc: the alias lines in it are real
for (const [, name, value] of read(get(HOME + '/.bashrc')).matchAll(/^alias ([^=\s]+)='([^']*)'/gm)) ctx.aliases[name] = value;

const prompt = () => `${ctx.user}@${ctx.host}:${short(ctx.cwd)}$`;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// A line is { spans: [{ text, tone }], delay? }. This is the only renderer.
async function print(lines) {
  for (const line of lines) {
    if (line.delay) await sleep(line.delay);
    const el = document.createElement('div');
    for (const span of line.spans) {
      const s = document.createElement('span');
      s.textContent = span.text;
      if (span.tone) s.className = span.tone;
      el.append(s);
    }
    out.append(el);
    input.scrollIntoView({ block: 'end' });
  }
}

// split a line into words, honouring quotes, then drop the quotes
const words = (raw) => (raw.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? []).map(w => w.replace(/"([^"]*)"|'([^']*)'/g, '$1$2'));

function run(raw) {
  let [cmd, ...args] = words(raw);
  if (!cmd) return [];
  if (ctx.aliases[cmd]) [cmd, ...args] = [...words(ctx.aliases[cmd]), ...args];
  const fn = commands[cmd];
  if (!fn) return [{ spans: [{ text: `bash: ${cmd}: command not found` }] }];
  return fn(args, ctx);
}

// history: arrow keys walk previous commands
let cursor = 0;

// commands run one after another, so a delayed line never interleaves with the next command
let queue = Promise.resolve();

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const raw = input.value;
  input.value = '';
  sync();
  if (raw.trim()) ctx.history.push(raw);
  cursor = ctx.history.length;
  queue = queue.then(async () => {
    await print([{ spans: [{ text: prompt() + ' ', tone: 'dim' }, { text: raw }] }]);
    await print(run(raw));
    label.textContent = prompt();
    input.scrollIntoView({ block: 'end' });
  });
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' && cursor > 0) {
    cursor--;
    input.value = ctx.history[cursor];
    sync();
    e.preventDefault();
  } else if (e.key === 'ArrowDown') {
    cursor = Math.min(cursor + 1, ctx.history.length);
    input.value = ctx.history[cursor] ?? '';
    sync();
    e.preventDefault();
  }
});

// the input is exactly as wide as its text, so the block cursor sits right after it
function sync() { input.style.width = input.value.length + 'ch'; }

// cursor stops blinking while typing
let typing;
input.addEventListener('input', () => {
  sync();
  form.classList.add('typing');
  clearTimeout(typing);
  typing = setTimeout(() => form.classList.remove('typing'), 500);
});

// tapping anywhere in the terminal focuses the input
document.addEventListener('click', () => input.focus());

print([
]);
input.focus();
