// Pure helpers over the filesystem map. No DOM, no state: every function
// takes what it needs as arguments and returns plain values.

import { vfs, HOME } from '../content/vfs.js';

export { vfs, HOME };

export const HANDLE = HOME.slice(HOME.lastIndexOf('/') + 1);

export const join   = (dir, name) => (dir === '/' ? '' : dir) + '/' + name;
export const base   = (path) => path === '/' ? '/' : path.slice(path.lastIndexOf('/') + 1);
export const parent = (path) => path === '/' ? '/' : path.slice(0, path.lastIndexOf('/')) || '/';

// absolute, normalised path from whatever the visitor typed
export function resolve(p, cwd) {
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

export const get = (path) => vfs.get(path);

// a link behaves as whatever it points to
export const follow = (path) => { const n = vfs.get(path); return n?.type === 'link' ? n.target : path; };

// direct children of a directory, by prefix, sorted like ls
export function children(dir) {
  const prefix = dir === '/' ? '/' : dir + '/';
  return [...vfs.keys()]
    .filter(p => p !== dir && p.startsWith(prefix) && !p.slice(prefix.length).includes('/'))
    .map(p => p.slice(prefix.length))
    .sort((a, b) => a.replace(/^\./, '').localeCompare(b.replace(/^\./, '')));
}

export const isDir  = (path) => vfs.get(follow(path))?.type === 'dir';
export const locked = (path) => [...vfs].some(([p, n]) => n.locked && (path === p || path.startsWith(p + '/')));

// /home/unikorm/x -> ~/x, as bash shows it
export const short = (path) => path === HOME ? '~' : path.startsWith(HOME + '/') ? '~' + path.slice(HOME.length) : path;

// contents of a file as a string; bodies may be functions (see /dev/urandom)
export const read = (node) => typeof node.body === 'function' ? node.body() : (node.body ?? '');

const DEFAULT_MODE = { dir: 'drwxr-xr-x', file: '-rw-r--r--', link: 'lrwxrwxrwx', device: 'crw-rw-rw-' };

// node plus the metadata ls -l and stat show. Content only sets what differs
// from the default; size is the real byte count of the body.
export function meta(path) {
  const n = vfs.get(path);
  const owner = n.owner ?? (path === HOME || path.startsWith(HOME + '/') ? HANDLE : 'root');
  const size = n.type === 'dir' ? 4096
             : n.type === 'link' ? n.target.length
             : typeof n.body === 'string' ? new TextEncoder().encode(n.body).length : 0;
  const nlink = n.type === 'dir' ? 2 + children(path).filter(c => get(join(path, c))?.type === 'dir').length : 1;
  return { ...n, mode: n.mode ?? DEFAULT_MODE[n.type], owner, size, nlink, mtime: n.mtime ?? '2026-01-01' };
}
