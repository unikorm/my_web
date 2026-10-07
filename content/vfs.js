// The whole site is this map. Keys are absolute paths. Directories are
// explicit entries; their children are found by path prefix. Adding a blog
// post is one new entry here and nothing else.
//
// Node: { type: 'dir' | 'file' | 'link', mtime, body?, target?,
//         mode?, owner?, locked? }
// mode and owner default to the usual (drwxr-xr-x root, -rw-r--r--, and the
// handle for anything under HOME). Size is the real byte count of the body.
// Bodies are wrapped at 76 columns by hand, never by CSS.

export const HOME = '/home/unikorm';

const dir  = (mtime, extra = {})         => ({ type: 'dir',    mtime, ...extra });
const file = (mtime, body, extra = {})   => ({ type: 'file',   mtime, body, ...extra });
const link = (mtime, target)             => ({ type: 'link',   mtime, target });

export const vfs = new Map(Object.entries({
  '/': dir('1999-09-02'),

  // --- etc --------------------------------------------------------------
  '/etc': dir('2020-09-01'),
  '/etc/hostname': file('2020-09-01', 'unikorm.eu'),
  '/etc/aliases': file('2020-09-01',
`# /etc/aliases -- where to reach me

hire:        https://www.linkedin.com/in/adam-lednicky-17159b243/
adam:        adaled00@gmail.com
git:         https://github.com/unikorm`),

  '/etc/cron.d': dir('2020-09-01'),
  '/etc/cron.d/momentkaph': file('2026-10-01',
`# /etc/cron.d/momentkaph -- side project hours
# m   h   dom mon dow   user     command
  0   20  *   *   1-4   unikorm  cd /opt/momentkaph && npm run ci
  30  21  *   *   1-4   unikorm  git push origin main        # actions take it from here
  0   22  *   *   1-4   unikorm  tail -f ci.log | grep -v ok # watching the pipeline
  0   11  *   *   0     unikorm  write CHANGELOG             # usually skipped`),

  '/etc/opinions.d': dir('2026-04-02'),
  '/etc/opinions.d/10-code.conf': file('2026-04-02',
`# /etc/opinions.d/10-code.conf
# last modified 2026-04-02

Functions.length            = screen        # if it scrolls, it splits
Comments.explain            = why           # not what
Errors.swallow              = false
Errors.message              = what-happened
# Clever                    = good          # deprecated 2019
Clever                      = suspicious
Rewrite.from_scratch        = after-the-second-time`),
  '/etc/opinions.d/40-tooling.conf': file('2026-04-02',
`# /etc/opinions.d/40-tooling.conf
# last modified 2026-04-02

Dependencies.add            = reluctantly
Dependencies.remove         = eagerly
Build.step                  = optional
Deploy.day                  = not-friday
Deploy.method               = tarball + ssh # boring is a feature
Editor                      = vs code
Terminal                    = love it`),
  '/etc/opinions.d/90-life.conf': file('2026-04-02',
`# /etc/opinions.d/90-life.conf
# last modified 2026-04-02

Meetings.default            = accept
Notifications               = off
Side_projects.limit         = 2             # currently: 4
Sleep.hours                 = 7`),

  // --- home -------------------------------------------------------------
  '/home': dir('2016-09-01'),
  '/home/unikorm': dir('2026-10-03'),
  '/home/unikorm/.bashrc': file('2026-10-03',
`# ~/.bashrc -- sourced on login. the alias lines below are real, try them.

alias ll='ls -l'
alias la='ls -la'
alias l='ls -lah'
alias ..='cd ..'
alias cls='clear'
alias please='sudo'`),
  '/home/unikorm/projects': link('2026-10-03', '/opt'),

  // --- media ------------------------------------------------------------
  '/media': dir('2026-10-01'),
  '/media/books': file('2026-10-01',
`# mounted read-only. currently open:

- (replace me) a book about systems
- (replace me) something not about computers`),
  '/media/music': file('2026-10-01',
`# on repeat while the society falls:

- (replace me) one album
- (replace me) one playlist, badly named`),

  // --- opt --------------------------------------------------------------
  '/opt': dir('2026-10-03'),
  '/opt/my_web': dir('2026-10-03'),
  '/opt/my_web/README.md': file('2026-10-03',
`my_web
======

this site. a shell, a filesystem, and nothing else.
source: https://github.com/unikorm/my_web`),
  '/opt/momentkaph': dir('2026-09-28'),
  '/opt/momentkaph/README.md': file('2026-09-28',
`momentkaph
==========

a web app in two halves. (replace me: what it does, in one sentence)

backend    node 24, typescript, packaged as a tarball, served behind nginx
frontend   static, mirrored to the webspace over sftp
pipeline   github actions. push to main, wait, refresh, pray.`),

  // --- proc -------------------------------------------------------------
  '/proc': dir('2026-10-03'),
  '/proc/uptime': file('2026-10-03', '10 years since the first line of code'),
  '/proc/self': dir('2026-10-03'),
  '/proc/self/status': file('2026-10-03',
`Name:      unikorm
State:     R (running)
Role:      system integration engineer
Employer:  (replace me)
Threads:   4                         # work, family, side projects, sleep
Blocked:   waiting on more time
Open:      to interesting problems
Cpus_allowed:  1
Mems_allowed:  see free -h`),

  // --- root -------------------------------------------------------------
  '/root': dir('2016-09-01', { mode: 'drwx------', locked: true }),

  // --- srv --------------------------------------------------------------
  '/srv': dir('2026-10-03'),

  // --- tmp --------------------------------------------------------------
  '/tmp': dir('2026-10-03', { mode: 'drwxrwxrwt' }),

  // --- usr --------------------------------------------------------------
  '/usr': dir('2016-09-01'),
  '/usr/share': dir('2016-09-02'),
  '/usr/share/man': dir('2026-10-03'),
  '/usr/share/man/man1': dir('2026-10-03'),
  '/usr/share/man/man1/life.1': file('2026-10-7',
`life -- how it works



a command is 'wake up' then 'survive' and then 'sleep'`
  ),

  // --- var --------------------------------------------------------------
  '/var': dir('2026-10-03'),
  '/var/log': dir('2026-10-03'),
  '/var/log/2026-10-03-17-48-00': file('2026-10-03T17:48',
`hi there
2026-10-03

life is too short to make borin shits`),
}));
