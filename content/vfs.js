// The whole site is this map. Keys are absolute paths. Directories are
// explicit entries; their children are found by path prefix. Adding a blog
// post is one new entry here and nothing else.
//
// Node: { type: 'dir' | 'file', body?: string, locked?: true }
// Bodies are wrapped at 76 columns by hand, never by CSS.
// Everything marked (replace me) is placeholder content.

export const HOME = '/home/unikorm';

export const vfs = new Map(Object.entries({
  '/':                    { type: 'dir' },
  '/etc':                 { type: 'dir' },
  '/etc/hostname':        { type: 'file', body: 'unikorm.eu' },
  '/home':                { type: 'dir' },
  '/home/unikorm':        { type: 'dir' },
  '/opt':                 { type: 'dir' },
  '/opt/my_web':          { type: 'dir' },
  '/opt/my_web/README.md':   { type: 'file', body:
`my_web
======

this site. a shell, a filesystem, and nothing else.
source: https://github.com/unikorm/my_web` },
  '/proc':                { type: 'dir' },
  '/proc/uptime':         { type: 'file', body: '10 years since the first line of code' },
  '/root':                { type: 'dir', locked: true },
  '/var':                 { type: 'dir' },
  '/var/log':             { type: 'dir' },
  '/var/log/2026-10-03-17-48-00': { type: 'file', body:
`hi there
2026-10-03

life is too short to make borin shits` },
}));
