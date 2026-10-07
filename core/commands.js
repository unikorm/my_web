// Every command is (args, ctx) => Line[]. Pure: no DOM, no storage. The only
// things a command may change are fields on ctx (cwd, history, aliases).
//
// ctx: { user, host, cwd, prev, env, history, aliases, clear(), theme(name) }

import { vfs, HOME, HANDLE, resolve, follow, children, isDir, locked, get, read, meta, join, base, parent } from './fs.js';
import { sys, procs, mem, disks } from '../content/system.js';

const L = (text, tone) => ({ spans: [{ text, tone }] });
const lines = (text, tone) => text.split('\n').map(t => L(t, tone));

// --- small helpers --------------------------------------------------------

// split "-la" style flags from the rest; "--long" options go in longs
function parse(args) {
  const flags = new Set(), longs = new Set(), paths = [];
  for (const a of args) {
    if (a.startsWith('--') && a.length > 2) longs.add(a.slice(2));
    else if (a.startsWith('-') && a.length > 1) for (const c of a.slice(1)) flags.add(c);
    else paths.push(a);
  }
  return { flags, longs, paths };
}

// pad columns so tables line up; `right` lists the right-aligned columns
function table(rows, right = []) {
  const w = [];
  for (const r of rows) r.forEach((c, i) => { w[i] = Math.max(w[i] ?? 0, String(c).length); });
  return rows.map(r => r.map((c, i) => right.includes(i) ? String(c).padStart(w[i]) : String(c).padEnd(w[i])).join(' ').trimEnd());
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const p2 = (n) => String(n).padStart(2, '0');
const clock = (d = new Date()) => `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;

// `Oct  3 17:48` for recent files, `Dec 30  2025` for old ones, like ls
// '2026-10-03' is local midnight, not UTC
const when = (iso) => new Date(iso.includes('T') ? iso : iso + 'T00:00');

function lsDate(iso) {
  const d = when(iso);
  const recent = Date.now() - d < 183 * 864e5;
  return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2)} ` +
    (recent ? `${p2(d.getHours())}:${p2(d.getMinutes())}` : ` ${d.getFullYear()}`);
}

// 4.0K, 12K, 1.2M, like ls -h
function human(bytes) {
  if (bytes < 1024) return String(bytes);
  const k = bytes / 1024;
  if (k < 10) return k.toFixed(1) + 'K';
  if (k < 1024) return Math.round(k) + 'K';
  const m = k / 1024;
  return (m < 10 ? m.toFixed(1) : Math.round(m)) + 'M';
}

// years and days since sys.boot
function up() {
  const days = Math.floor((Date.now() - new Date(sys.boot)) / 864e5);
  const y = Math.floor(days / 365.25);
  return `${y} years, ${Math.floor(days - y * 365.25)} days`;
}

// open a file for reading, with the real error wording of `cmd`
function open(arg, cwd, cmd) {
  const path = resolve(arg, cwd);
  if (locked(path)) return { error: `${cmd}: ${arg}: Permission denied` };
  const node = get(follow(path));
  if (!node) return { error: `${cmd}: ${arg}: No such file or directory` };
  if (node.type === 'dir') return { error: `${cmd}: ${arg}: Is a directory` };
  return { text: read(node), path: follow(path) };
}

const name = (path, text) => ({ text, tone: isDir(path) ? 'bright' : undefined });

// glob -> RegExp
const glob = (g) => new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');

// expand $VAR and leading ~ the way the shell would
const expand = (word, ctx) => word.replace(/^~(?=\/|$)/, HOME).replace(/\$(\w+)/g, (_, k) => ctx.env[k] ?? (k === 'PWD' ? ctx.cwd : ''));

const BUILTINS = new Set(['cd', 'pwd', 'echo', 'alias', 'history', 'exit', 'help', 'theme']);

// --- navigation -------------------------------------------------------------
function pwd(args, ctx) { return [L(ctx.cwd)]; }

function cd([arg], ctx) {
  const path = arg === '-' ? ctx.prev : resolve(arg, ctx.cwd);
  const node = get(path);
  if (!node) return [L(`bash: cd: ${arg}: No such file or directory`)];
  if (locked(path)) return [L(`bash: cd: ${arg}: Permission denied`)];
  const target = follow(path);
  if (get(target)?.type !== 'dir') return [L(`bash: cd: ${arg}: Not a directory`)];
  ctx.prev = ctx.cwd;
  ctx.cwd = target;
  return arg === '-' ? [L(ctx.cwd)] : [];
}


function ls(args, ctx) {
  const { flags, paths } = parse(args);
  for (const f of flags) if (!'lahRt'.includes(f)) return [L(`ls: invalid option -- '${f}'`), L("Try 'man ls' for more information.")];
  const arg = paths[0] ?? '.';
  const path = resolve(arg, ctx.cwd);
  if (!get(path)) return [L(`ls: cannot access '${arg}': No such file or directory`)];
  if (locked(path)) return [L(`ls: cannot open directory '${arg}': Permission denied`)];
  const out = [];

  const render = (entries, label) => {
    if (flags.has('R')) out.push(L(`${label}:`));
    if (flags.has('t')) entries.sort((a, b) => meta(b.path).mtime.localeCompare(meta(a.path).mtime));
    if (flags.has('l')) {
      const ms = entries.map(e => ({ ...e, m: meta(e.path) }));
      if (label) out.push(L(`total ${ms.reduce((s, e) => s + Math.ceil(e.m.size / 4096) * 4, 0)}`));
      const rows = table(ms.map(e => [e.m.mode, e.m.nlink, e.m.owner, e.m.owner, flags.has('h') ? human(e.m.size) : e.m.size, lsDate(e.m.mtime)]), [1, 4]);
      ms.forEach((e, i) => out.push({ spans: [{ text: rows[i] + ' ' }, name(e.path, e.name), ...(e.m.type === 'link' ? [{ text: ' -> ' + e.m.target }] : [])] }));
    } else if (entries.length) {
      const spans = [];
      entries.forEach((e, i) => { if (i) spans.push({ text: '  ' }); spans.push(name(e.path, e.name)); });
      out.push({ spans });
    }
    if (flags.has('R')) {
      out.push(L(''));
      for (const e of entries) {
        if (e.name === '.' || e.name === '..' || get(e.path).type !== 'dir' || locked(e.path)) continue;
        render(list(e.path), join(label, e.name));
      }
    }
  };

  const list = (dir) => {
    const entries = children(dir).filter(n => flags.has('a') || !n.startsWith('.')).map(n => ({ name: n, path: join(dir, n) }));
    if (flags.has('a')) entries.unshift({ name: '.', path: dir }, { name: '..', path: parent(dir) });
    return entries;
  };

  const dir = follow(path);
  if (get(dir).type !== 'dir') render([{ name: arg, path }], null);
  else render(list(dir), arg);
  return out;
}

function tree([arg = '.'], ctx) {
  const root = resolve(arg, ctx.cwd);
  if (!isDir(root) || locked(root)) return [L(`${arg} [error opening dir]`), L(''), L('0 directories, 0 files')];
  const out = [L(arg, 'bright')];
  let dirs = 0, files = 0;
  const walk = (dir, prefix) => {
    const names = children(dir).filter(n => !n.startsWith('.'));
    names.forEach((n, i) => {
      const last = i === names.length - 1;
      const path = join(dir, n);
      const node = get(path);
      const text = prefix + (last ? '└── ' : '├── ');
      if (node.type === 'link') { files++; out.push({ spans: [{ text }, name(path, n), { text: ' -> ' + node.target }] }); return; }
      out.push({ spans: [{ text }, name(path, n)] });
      if (node.type === 'dir') { dirs++; if (!node.locked) walk(path, prefix + (last ? '    ' : '│   ')); }
      else files++;
    });
  };
  walk(follow(root), '');
  out.push(L(''), L(`${dirs} directories, ${files} files`));
  return out;
}

function find(args, ctx) {
  const rest = [...args];
  let start = rest[0] && !rest[0].startsWith('-') ? rest.shift() : '.';
  let pattern = rest.includes('-name') ? rest[rest.indexOf('-name') + 1] : undefined;
  let root = resolve(start, ctx.cwd);
  if (!get(root)) {
    if (args.length !== 1) return [L(`find: '${start}': No such file or directory`)];
    pattern = `*${start}*`; start = '/'; root = '/';   // `find blog`: search the whole machine
  }
  const re = pattern && glob(pattern);
  const out = [];
  const prefix = root === '/' ? '/' : root + '/';
  for (const p of vfs.keys()) {
    if (p !== root && !p.startsWith(prefix)) continue;
    if (locked(p) && p !== '/root') continue;
    if (re && !re.test(base(p))) continue;
    out.push(L(start === '/' ? p : start.replace(/\/$/, '') + p.slice(root.length)));
    if (locked(p)) out.push(L(`find: '${p}': Permission denied`));
  }
  return out;
}

function grep(args, ctx) {
  const { flags, paths } = parse(args);
  const [pattern, ...files] = paths;
  if (!pattern || !files.length) return [L('Usage: grep [-ir] PATTERN FILE...')];
  let re;
  try { re = new RegExp(pattern, flags.has('i') ? 'i' : ''); }
  catch { re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags.has('i') ? 'i' : ''); }
  const out = [], targets = [];
  for (const f of files) {
    const path = resolve(f, ctx.cwd);
    const node = get(follow(path));
    if (!node) { out.push(L(`grep: ${f}: No such file or directory`)); continue; }
    if (locked(path)) { out.push(L(`grep: ${f}: Permission denied`)); continue; }
    if (node.type !== 'dir') { targets.push([f, follow(path)]); continue; }
    if (!flags.has('r')) { out.push(L(`grep: ${f}: Is a directory`)); continue; }
    const prefix = follow(path) === '/' ? '/' : follow(path) + '/';
    for (const k of vfs.keys()) if (k.startsWith(prefix) && get(k).type !== 'dir' && !locked(k)) targets.push([k, k]);
  }
  const many = targets.length > 1;
  for (const [label, path] of targets)
    for (const line of read(get(path)).split('\n'))
      if (re.test(line)) out.push(many ? { spans: [{ text: label + ':', tone: 'dim' }, { text: line }] } : L(line));
  return out;
}

// --- reading ----------------------------------------------------------------

function cat(args, ctx) {
  if (!args.length) return [L('usage: cat <file>', 'dim')];
  return args.flatMap(arg => {
    const r = open(arg, ctx.cwd, 'cat');
    return r.error ? [L(r.error)] : lines(r.text);
  });
}

function headTail(cmd) {
  return (args, ctx) => {
    let n = 10;
    const files = [];
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-n') n = Number(args[++i]) || 10;
      else if (/^-\d+$/.test(args[i])) n = -args[i];
      else files.push(args[i]);
    }
    if (!files.length) return [L(`usage: ${cmd} [-n N] <file>`, 'dim')];
    return files.flatMap(f => {
      const r = open(f, ctx.cwd, cmd);
      if (r.error) return [L(r.error)];
      const all = r.text.split('\n');
      const part = cmd === 'head' ? all.slice(0, n) : all.slice(-n);
      return [...(files.length > 1 ? [L(`==> ${f} <==`, 'bright')] : []), ...part.map(t => L(t))];
    });
  };
}

function man([topic]) {
  if (!topic) return [L('What manual page do you want?'), L("For example, try 'man man'.")];
  const node = get(`/usr/share/man/man1/${topic}.1`);
  if (!node) return [L(`No manual entry for ${topic}`)];
  return read(node).split('\n').map(t => L(t, /^[A-Z][A-Z ]*$/.test(t) || /^[A-Z]+\(1\)/.test(t) ? 'bright' : undefined));
}

function which(args) {
  return args.flatMap(c => {
    if (get(`/usr/local/bin/${c}`)) return [L(`/usr/local/bin/${c}`)];
    if (commands[c] && !BUILTINS.has(c)) return [L(`/usr/bin/${c}`)];
    return [];
  });
}


// --- identity ---------------------------------------------------------------

function neofetch() {
  const logo = [
    '   ╭────────────────────╮ ',
    '   │ ●  ●  ●            │ ',
    '   ├────────────────────┤ ',
    '   │ $ whoami           │ ',
    '   │ unikorm            │ ',
    '   │ $ █                │ ',
    '   │                    │ ',
    '   │                    │ ',
    '   ╰────────────────────╯ ',
    '        ╲__________╱      ',
  ];
  const info = [
    ['', `${HANDLE}@${sys.host}`],
    ['', '-'.repeat(HANDLE.length + sys.host.length + 1)],
    ['OS', `${sys.os} ${sys.arch}`],
    ['Host', sys.where],
    ['Kernel', sys.kernel],
    ['Uptime', up()],
    ['Packages', `${children('/opt').length} (opt)`],
    ['Shell', sys.shell],
    ['Terminal', sys.host],
    ['CPU', sys.cpu],
    ['Memory', `${mem.used}MiB / ${mem.total}MiB (mostly momentkaph)`],
  ];
  const n = Math.max(logo.length, info.length);
  return Array.from({ length: n }, (_, i) => {
    const [k, v] = info[i] ?? ['', ''];
    return { spans: [{ text: (logo[i] ?? ' '.repeat(logo[0].length)) + '  ', tone: 'bright' }, ...(k ? [{ text: k + ': ', tone: 'bright' }] : []), { text: v }] };
  });
}

// --- system -----------------------------------------------------------------

function top() {
  const count = (s) => procs.filter(p => p.s === s).length;
  const head = [
    `top - ${clock()} up ${up()},  1 user,  load average: ${sys.load}`,
    `Tasks: ${procs.length} total, ${count('R')} running, ${count('S')} sleeping, ${count('D')} blocked`,
    `%Cpu(s): ${procs.reduce((s, p) => s + p.cpu, 0).toFixed(1)} attention,  0.0 id`,
    `MiB Mem : ${mem.total} total, ${mem.free} free, ${mem.used} used, ${mem.cache} buff/cache`,
    `MiB Swap: ${mem.swapTotal} total, ${mem.swapFree} free, ${mem.swapUsed} used. (sleep)`,
    '',
  ];
  const rows = table([
    ['PID', 'USER', 'PR', 'NI', 'S', '%CPU', '%MEM', 'TIME+', 'COMMAND'],
    ...procs.map(p => [p.pid, p.user, 20, 0, p.s, p.cpu.toFixed(1), p.mem.toFixed(1), p.time, p.cmd]),
  ], [0, 2, 3, 5, 6, 7]);
  return [...head.map(t => L(t)), L(rows[0], 'invert'), ...rows.slice(1).map(t => L(t))];
}

function df() {
  return table([['Filesystem', 'Size', 'Used', 'Avail', 'Use%', 'Mounted on'], ...disks], [1, 2, 3, 4]).map((t, i) => L(t, i ? undefined : 'bright'));
}

function free(args) {
  const h = parse(args).flags.has('h');
  const f = (mib) => h ? (mib >= 1024 ? (mib / 1024).toFixed(1).replace(/\.0$/, '') + 'Gi' : mib + 'Mi') : String(mib * 1024);
  const rows = table([
    ['', 'total', 'used', 'free', 'shared', 'buff/cache', 'available'],
    ['Mem:', f(mem.total), f(mem.used), f(mem.free), f(mem.shared), f(mem.cache), f(mem.available)],
    ['Swap:', f(mem.swapTotal), f(mem.swapUsed), f(mem.swapFree)],
  ], [1, 2, 3, 4, 5, 6]);
  return rows.map(t => L(t));
}

function history(args, ctx) {
  if (args[0] === '-c') { ctx.history.length = 0; return []; }
  return ctx.history.map((h, i) => L(`${String(i + 1).padStart(5)}  ${h}`));
}

function date() {
  const d = new Date();
  const tz = new Intl.DateTimeFormat('en-GB', { timeZoneName: 'short' }).formatToParts(d).find(p => p.type === 'timeZoneName')?.value ?? 'UTC';
  return [L(`${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2)} ${clock(d)} ${tz} ${d.getFullYear()}`)];
}

function echo(args, ctx) {
  return [L(args.map(a => expand(a, ctx)).join(' '))];
}

function sudo(args, ctx) {
  if (!args.length) return [L('usage: sudo <command>')];
  return [
    L(`[sudo] password for ${ctx.user}: `),
    { spans: [{ text: `${ctx.user} is not in the sudoers file.  This incident will be reported.` }], delay: 900 },
  ];
}

// --- the table ----------------------------------------------------------------

export const commands = {
  // navigation
  ls, cd, pwd, tree, find, grep,
  // reading
  cat, head: headTail('head'), tail: headTail('tail'), man, which,
  // identity
  whoami: () => [L('nobody')],
  id: () => [L('uid=65534(nobody) gid=65534(nogroup) groups=65534(nogroup)')],
  hostname: () => [L(read(get('/etc/hostname')))],
  uptime: () => [L(` ${clock()} up ${up()},  1 user}`)],
  neofetch,
  // system
  top, df, free, history, date,
  // shell
  help: () => [L("help doesn't come here", 'dim')],
  clear: (args, ctx) => { ctx.clear(); return []; },
  echo,
  // jokes
  sudo
};
