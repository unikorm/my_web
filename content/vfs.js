// The whole site is this map. Keys are absolute paths. Directories are
// explicit entries; their children are found by path prefix. Adding a blog
// post is one new entry here and nothing else.
//
// Node: { type: 'dir' | 'file' | 'link' | 'device', mtime, body?, target?,
//         mode?, owner?, locked? }
// mode and owner default to the usual (drwxr-xr-x root, -rw-r--r--, and the
// handle for anything under HOME). Size is the real byte count of the body.
// Bodies are wrapped at 76 columns by hand, never by CSS.

export const HOME = '/home/unikorm';

const dir  = (mtime, extra = {})         => ({ type: 'dir',    mtime, ...extra });
const file = (mtime, body, extra = {})   => ({ type: 'file',   mtime, body, ...extra });
const link = (mtime, target)             => ({ type: 'link',   mtime, target });

export const vfs = new Map(Object.entries({
  '/': dir('2020-09-01'),

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
Names.abbreviations         = never         # usr was a mistake, we live with it
Comments.explain            = why           # not what
Errors.swallow              = false
Errors.message              = what-happened + what-to-do
# Clever                    = good          # deprecated 2019
Clever                      = suspicious
Tests.cover                 = the-bugs-i-actually-had
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
alias please='sudo'

export EDITOR=vi`),
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
  '/usr/local': dir('2026-09-28'),
  '/usr/local/bin': dir('2026-09-28'),
  '/usr/local/bin/deploy': file('2026-09-28',
`#!/usr/bin/env bash
# deploy -- mirror src/ to the webspace. the frontend pipeline runs this.
set -euo pipefail
lftp -u "$USER,$PASS" "sftp://$HOST" -e "
  set sftp:auto-confirm yes;
  mirror -R --delete ./src/ $TARGET;
  bye"
echo "deployed. now refresh and pray."`, { mode: '-rwxr-xr-x' }),
  '/usr/local/bin/newpost': file('2026-10-03',
`#!/usr/bin/env bash
# newpost <slug> -- start a blog post in /var/log, named by date
d=$(date +%F)
f="/var/log/$d-$1"
printf '%s\\n%s\\n\\n' "$1" "$d" > "$f"
$EDITOR "$f"`, { mode: '-rwxr-xr-x' }),
  '/usr/share': dir('2016-09-01'),
  '/usr/share/doc': dir('2026-10-03'),
  '/usr/share/doc/my_web': dir('2026-10-03'),
  '/usr/share/doc/my_web/ARCHITECTURE': file('2026-10-03',
`my_web -- how it works

content/   the filesystem. a flat map of path -> node. pure data.
core/      fs.js resolves paths, commands.js turns argv into lines. pure.
app.js     the only file that touches the dom.

a command is (args, ctx) -> lines. it never prints, it returns.
the renderer is the only thing that knows what a <span> is.`),
  '/usr/share/games': dir('2026-10-03'),
  '/usr/share/games/fortunes': dir('2026-10-03'),
  '/usr/share/games/fortunes/unikorm': file('2026-10-03',
`it works on my machine. this is my machine.
%
there are two hard problems: cache invalidation, naming, and off-by-one.
%
the build is green. the build is also lying.
%
a week of debugging can save you an hour of reading the docs.
%
sleep is a cache. you can skip it, but everything gets slower.
%
life is too short to make borin shits.
%
every "quick fix" has a birthday.
%
if it is not in version control, it does not exist.`),
  '/usr/share/man': dir('2026-10-03'),
  '/usr/share/man/man1': dir('2026-10-03'),
  '/usr/share/man/man1/unikorm.1': file('2026-10-03',
`UNIKORM(1)                     User Commands                     UNIKORM(1)

NAME
       unikorm - adam, software developer, builds things for the web

SYNOPSIS
       unikorm [--coffee] [--headphones] <problem>

DESCRIPTION
       Takes a vague problem on stdin and emits working software on stdout,
       eventually. Prefers typescript, small tools, plain text and things
       that still run in ten years.

       Ten years in. Started with hello world and is still doing variations
       of it, with better error handling.

OPTIONS
       --async
              Replies within a day, not within a minute. Write, do not call.

       --direct
              Say the thing. Short messages get read first.

       --no-meetings
              Default. Override with a reason and an agenda.

ENVIRONMENT
       TZ      Europe (CET/CEST)
       HOURS   09:00-18:00, best output before noon
       LOCALE  en, plus one that needs diacritics

EXIT STATUS
       0       shipped
       1       shipped, with a TODO
       130     interrupted by a better idea

BUGS
       Starts more projects than it finishes. See /lost+found.
       Rewrites working code because it "could be cleaner".
       Underestimates everything by a factor of two, consistently.

SEE ALSO
       neofetch(1), top(1), dmesg(1), /var/log, /etc/opinions.d

AUTHOR
       Written by unikorm. Report bugs to /dev/null.`),
  '/usr/share/man/man1/man.1': file('2026-10-03',
`MAN(1)                         User Commands                         MAN(1)

NAME
       man - read the manual

SYNOPSIS
       man <topic>

DESCRIPTION
       Pages live in /usr/share/man/man1. There is one for the author:

              man unikorm

       and one for most commands here. ls /usr/share/man/man1 to see them.`),
  '/usr/share/man/man1/ls.1': file('2026-10-03',
`LS(1)                          User Commands                          LS(1)

NAME
       ls - list directory contents

SYNOPSIS
       ls [-lahRt] [FILE]

DESCRIPTION
       List information about FILE (the current directory by default).

       -a     do not ignore entries starting with .
       -h     with -l, print sizes like 1K 234M
       -l     use a long listing format
       -R     list subdirectories recursively
       -t     sort by modification time, newest first

       ll is an alias for ls -l. See ~/.bashrc for the others.

SEE ALSO
       tree(1), stat(1), find(1)`),
  '/usr/share/man/man1/cd.1': file('2026-10-03',
`CD(1)                          User Commands                          CD(1)

NAME
       cd - change the working directory

SYNOPSIS
       cd [DIR]

DESCRIPTION
       With no DIR, go home. cd - goes back to where you were. cd .. goes
       up. ~ is /home/unikorm. /root is not for you.`),
  '/usr/share/man/man1/cat.1': file('2026-10-03',
`CAT(1)                         User Commands                         CAT(1)

NAME
       cat - print files

SYNOPSIS
       cat FILE...

DESCRIPTION
       Prints each FILE to the screen. less and more do the same here, there
       is no pager. head and tail take -n N. Try cat /dev/urandom.`),
  '/usr/share/man/man1/tree.1': file('2026-10-03',
`TREE(1)                        User Commands                        TREE(1)

NAME
       tree - list contents of directories in a tree-like format

SYNOPSIS
       tree [DIR]

DESCRIPTION
       Draws DIR (the current directory by default) as a tree. Hidden files
       are not shown; use ls -a for those.`),
  '/usr/share/man/man1/free.1': file('2026-10-03',
`FREE(1)                        User Commands                        FREE(1)

NAME
       free - display amount of free and used memory

SYNOPSIS
       free [-h]

DESCRIPTION
       Memory here is attention. Most of it is in use. Swap is sleep, and it
       is nearly full. -h prints human readable numbers.`),
  '/usr/share/man/man1/history.1': file('2026-10-03',
`HISTORY(1)                     User Commands                     HISTORY(1)

NAME
       history - what you typed

SYNOPSIS
       history [-c]

DESCRIPTION
       Lists the commands of this session, numbered. Arrow up walks through
       them. -c forgets everything.`),
  '/usr/share/man/man1/grep.1': file('2026-10-03',
`GREP(1)                        User Commands                        GREP(1)

NAME
       grep - print lines that match a pattern

SYNOPSIS
       grep [-ir] PATTERN FILE...

DESCRIPTION
       -i     ignore case
       -r     search directories recursively

       Try: grep -r strict /etc/opinions.d`),
  '/usr/share/man/man1/find.1': file('2026-10-03',
`FIND(1)                        User Commands                        FIND(1)

NAME
       find - search for files

SYNOPSIS
       find [DIR] [-name PATTERN]
       find WORD

DESCRIPTION
       Lists every path under DIR, or only those whose name matches PATTERN
       (* and ? work). A bare WORD searches the whole machine for it.`),
  '/usr/share/man/man1/neofetch.1': file('2026-10-03',
`NEOFETCH(1)                    User Commands                    NEOFETCH(1)

NAME
       neofetch - the about page, on one screen

DESCRIPTION
       A logo and some stats. Nothing is measured, everything is honest.
       See also top(1) for what is running and dmesg(1) for how it booted.`),

  // --- var --------------------------------------------------------------
  '/var': dir('2026-10-03'),
  '/var/log': dir('2026-10-03'),
  '/var/log/2026-10-03-17-48-00': file('2026-10-03T17:48',
`hi there
2026-10-03

life is too short to make borin shits`),
  '/var/log/now': file('2026-10-03',
`now -- 2026-10
--------------

building:   this site, momentkaph
reading:    /media/books
listening:  /media/music
thinking:   commands are a better interface than pages
avoiding:   /tmp/ideas.txt, last line`),
  '/var/log/dmesg': file('2026-10-03',
`[    0.000000] kernel: booting unikorm 1.0
[    0.000001] cpu: 1 core detected, clocked by curiosity
[  221.443801] input: first keyboard detected
[ 1096.552190] init: hello world printed. no errors. suspicious.
[ 1830.118344] WARNING: unhandled exception in career.plan, recovering
[ 2411.002981] net: first website online. table layout. regrets.
[ 3002.771230] fs: mounted /opt (side projects), 2 of 14 survived
[ 3650.000000] [  ok  ] started typescript.service
[ 4015.221870] WARNING: /dev/sleep: swap nearly full, performance degraded
[ 4100.019533] momentkaph: pipeline up. tarballs over sftp, nginx hashed.
[ 4210.550010] unikorm.eu: rebooted as a terminal. you are here.`),
  '/var/spool': dir('2026-10-03'),
  '/var/spool/next': file('2026-10-03',
`# /var/spool -- queued, not started. fifo, allegedly.

1. finish this site (write the actual content)
2. blog post: why a terminal
3. momentkaph: the next thing
4. that cli from /tmp/ideas.txt`),
}));
