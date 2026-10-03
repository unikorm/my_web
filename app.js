import { vfs, HOME } from './content/vfs.js';

const out = document.getElementById('out');
const input = document.getElementById('in');
const form = document.getElementById('line');
const label = document.querySelector('.prompt');
const USER = 'visitor69';
const HOST = 'unikorm';

// A line is { spans: [{ text, tone }] }. Commands return lines, never HTML.
const L = (text, tone) => ({ spans: [{ text, tone }] });

// --- filesystem ---------------------------------------------------------

let cwd = HOME;
let prev = HOME;   // for `cd -`

// absolute, normalised path from whatever the visitor typed
function resolve(p) {
  if (!p || p === '~') return HOME;
  if (p.startsWith('~/')) p = HOME + p.slice(1);
  if (!p.startsWith('/')) p = cwd + '/' + p;
  const parts = [];
  for (const seg of p.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') parts.pop(); else parts.push(seg);
  }
  return '/' + parts.join('/');
}

const join = (dir, name) => (dir === '/' ? '' : dir) + '/' + name;

// direct children of a directory, by prefix
function children(dir) {
  const prefix = dir === '/' ? '/' : dir + '/';
  return [...vfs.keys()]
    .filter(p => p !== dir && p.startsWith(prefix) && !p.slice(prefix.length).includes('/'))
    .map(p => p.slice(prefix.length))
    .sort();
}

const isDir = (path) => vfs.get(path)?.type === 'dir';
const locked = (path) => [...vfs].some(([p, n]) => n.locked && (path === p || path.startsWith(p + '/')));

// /home/unikorm/x -> ~/x, as bash shows it
const short = (path) => path === HOME ? '~' : path.startsWith(HOME + '/') ? '~' + path.slice(HOME.length) : path;
const prompt = () => `${USER}@${HOST}:${short(cwd)}$`;

// --- commands -----------------------------------------------------------

const commands = {
  help: () => [
    L("help doesn't come here", 'dim'),
  ],
  clear: () => { out.replaceChildren(); return []; },
  whoami: () => [L('nobody')],

  pwd: () => [L(cwd)],

  cd: ([arg]) => {
    const target = arg === '-' ? prev : resolve(arg);
    const node = vfs.get(target);
    if (!node) return [L(`bash: cd: ${arg}: No such file or directory`)];
    if (node.type !== 'dir') return [L(`bash: cd: ${arg}: Not a directory`)];
    if (locked(target)) return [L(`bash: cd: ${arg}: Permission denied`)];
    prev = cwd;
    cwd = target;
    return arg === '-' ? [L(cwd)] : [];
  },

  ls: (args) => {
    const all = args.includes('-a');
    const arg = args.find(a => !a.startsWith('-')) ?? '.';
    const target = resolve(arg);
    const node = vfs.get(target);
    if (!node) return [L(`ls: cannot access '${arg}': No such file or directory`)];
    if (locked(target)) return [L(`ls: cannot open directory '${arg}': Permission denied`)];
    if (node.type === 'file') return [L(arg)];
    const names = children(target).filter(n => all || !n.startsWith('.'));
    if (all) names.unshift('.', '..');
    const spans = [];
    for (const n of names) {
      if (spans.length) spans.push({ text: '  ' });
      const dir = n === '.' || n === '..' || isDir(join(target, n));
      spans.push({ text: n, tone: dir ? 'bright' : undefined });
    }
    return spans.length ? [{ spans }] : [];
  },

  cat: (args) => {
    if (!args.length) return [L('usage: cat <file>', 'dim')];
    return args.flatMap(arg => {
      const target = resolve(arg);
      if (locked(target)) return [L(`cat: ${arg}: Permission denied`)];
      const node = vfs.get(target);
      if (!node) return [L(`cat: ${arg}: No such file or directory`)];
      if (node.type === 'dir') return [L(`cat: ${arg}: Is a directory`)];
      return node.body.split('\n').map(t => L(t));
    });
  },
};

// --- terminal -----------------------------------------------------------

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
  sync();
  print([{ spans: [{ text: prompt() + ' ', tone: 'dim' }, { text: raw }] }]);
  if (raw.trim()) history.push(raw);
  cursor = history.length;
  print(run(raw));
  label.textContent = prompt();
  input.scrollIntoView({ block: 'end' });
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' && cursor > 0) {
    cursor--;
    input.value = history[cursor];
    sync();
    e.preventDefault();
  } else if (e.key === 'ArrowDown') {
    cursor = Math.min(cursor + 1, history.length);
    input.value = history[cursor] ?? '';
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
