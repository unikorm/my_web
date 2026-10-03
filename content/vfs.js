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
const dev  = (mtime, body)               => ({ type: 'device', mtime, body, mode: 'crw-rw-rw-' });

const pick = (list) => list[Math.floor(Math.random() * list.length)];

const thoughts = [
  'every system is legacy the moment it works',
  'the best code is the code you deleted last week',
  'naming things is hard. so is everything else, we just have no saying for it',
  'deploy on friday. live a little. (do not deploy on friday)',
  'a terminal is a conversation. a website is a monologue',
  'ship it. then write the blog post. then fix it. then repeat',
  'the second rewrite is the good one. the third is procrastination',
];

export const vfs = new Map(Object.entries({
  '/': dir('2020-09-01'),

  // --- boot -------------------------------------------------------------
  '/boot':      dir('2020-09-01'),
  '/boot/grub': dir('2020-09-01'),
  '/boot/grub/grub.cfg': file('2020-09-01',
`# grub.cfg -- what loaded this person. do not edit, it is already booted.

set default=0
set timeout=5

menuentry 'unikorm, with linux 6.8' {
    echo 'loading curiosity ...'
    linux   /vmlinuz root=/dev/first_computer ro quiet
    initrd  /initrd.img-dial-up
}

menuentry 'unikorm (recovery mode)' {
    linux   /vmlinuz root=/dev/first_computer ro single nomodeset
    echo 'the one where everything is fixed by turning it off and on'
}

# 2016: first line of code. it printed hello. it was enough.`),

  // --- dev --------------------------------------------------------------
  '/dev': dir('2016-09-01'),
  '/dev/null': dev('2020-09-01',
`# things written to /dev/null, in order of arrival

meetings that could have been a commit message
tabs vs spaces debates
"just one more dependency"
dark patterns
loud keyboards in open offices
unsolicited linkedin wisdom`),
  '/dev/urandom': dev('2020-09-01', () => pick(thoughts)),

  // --- etc --------------------------------------------------------------
  '/etc': dir('2020-09-01'),
  '/etc/hostname': file('2020-09-01', 'unikorm.eu'),
  '/etc/motd': file('2020-09-01',
`unikorm.eu  --  a shell, a filesystem, nothing else

  ls /            see what is here
  man unikorm     who is this guy
  ls -lt /var/log the blog, newest first
  cat /etc/motd   this

no cookies, no tracking, no framework. just a prompt.`),
  '/etc/os-release': file('2020-09-01',
`NAME="unikorm"
VERSION="1.0 (ten years in)"
ID=unikorm
ID_LIKE=debian
PRETTY_NAME="unikorm 1.0"
VERSION_ID="1.0"
BUILD_ID=2016
HOME_URL="https://unikorm.eu"
SUPPORT_URL="https://github.com/unikorm"
BUG_REPORT_URL="/dev/null"`),
  '/etc/passwd': file('2020-09-01',
`root:x:0:0:root:/root:/bin/bash
unikorm:x:1000:1000:Adam,somewhere in .eu:/home/unikorm:/bin/bash
visitor69:x:1001:1001:you,here:/home/unikorm:/bin/bash
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin`),
  '/etc/shells': file('2020-09-01',
`# /etc/shells: valid login shells
/bin/bash
/usr/bin/node          # v24, the daily driver
/usr/bin/tsc           # strict. no excuses.
/usr/bin/python3       # when the script is small and the deadline is close
/usr/sbin/nginx        # for serving things, not for thinking about them
# /usr/bin/zsh         # tried it. came back.`),
  '/etc/fstab': file('2020-09-01',
`# <file system>     <mount point>  <type>  <options>                  <dump> <pass>
/dev/coffee         /              ext4    defaults,noatime           0      1
/dev/family         /home          ext4    defaults,nofail            0      2
/dev/side_projects  /opt           ext4    defaults,x-systemd.automount 0    2
/dev/music          /media         vfat    ro,loud                    0      0
tmpfs               /tmp           tmpfs   size=ideas,mode=1777       0      0
/dev/sleep          none           swap    sw,insufficient            0      0`),
  '/etc/hosts': file('2020-09-01',
`127.0.0.1       localhost
127.0.1.1       unikorm.eu

# worth visiting
140.82.112.3    github.com              # where the code lives

# worth blocking
0.0.0.0         news.ycombinator.com    # "just five minutes"`),
  '/etc/aliases': file('2020-09-01',
`# /etc/aliases -- where mail for this host ends up

postmaster:  adam
hire:        adam
coffee:      adam
abuse:       /dev/null
adam:        adaled00@gmail.com
git:         https://github.com/unikorm`),

  '/etc/cron.d': dir('2020-09-01'),
  '/etc/cron.d/unikorm': file('2020-09-01',
`# /etc/cron.d/unikorm -- the routines that actually run
# m   h   dom mon dow   user     command
  0   7   *   *   1-5   unikorm  coffee && git pull --rebase
  30  7   *   *   1-5   unikorm  standup --planned=15m --actual=40m
  0   9   *   *   1-5   unikorm  tsc --watch                 # the real job
  0   12  *   *   *     unikorm  lunch || snack
  */15 *  *   *   *     unikorm  check-ci                    # nothing changed
  0   18  *   *   1-5   unikorm  git push && close-laptop
  0   10  *   *   6     unikorm  touch grass
  0   2   *   *   *     root     sleep --force               # frequently fails
  0   0   1   *   *     unikorm  echo "this month: blog more" >> /var/spool/next`),
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

TypeScript.strict           = always
TypeScript.enums            = never         # use unions
TypeScript.any              = emergency-only
Dependencies.add            = reluctantly
Dependencies.remove         = eagerly
Build.step                  = optional      # see: this site
# Microservices             = default       # deprecated 2023
Microservices               = when-org-chart-demands-it
Deploy.day                  = not-friday
Deploy.method               = tarball + ssh # boring is a feature
Editor                      = vim           # see: man vim`),
  '/etc/opinions.d/90-life.conf': file('2026-04-02',
`# /etc/opinions.d/90-life.conf
# last modified 2026-04-02

Meetings.default            = decline
Meetings.with_agenda        = maybe
Notifications               = off
Coffee.count                = 2             # three is a cry for help
Side_projects.limit         = 2             # currently: 2
Sleep.hours                 = 8             # see /etc/fstab, swap is insufficient
Boring_software             = good
Borin_shits                 = too-short-for  # see /var/log`),

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

export EDITOR=vim          # see: man vim. or do not.
export HISTSIZE=200`),
  '/home/unikorm/.plan': file('2026-10-03',
`what is on my mind this week

  - this site. a shell as a homepage. commands > pages.
  - momentkaph: ci/cd pipeline, nginx configs, tarballs over sftp
  - writing more. /var/log is embarrassingly short.
  - sleep. see /etc/fstab, swap is insufficient.`),
  '/home/unikorm/.env': file('2026-10-03',
`# never commit this file.
# (it is on a public website, but never commit it.)

NODE_ENV=production
DEBUG=false                       # it is true
SECRET_KEY=hunter2
DATABASE_URL=postgres://me:password@localhost:5432/feelings
JWT_SECRET=please-dont-look
OPENAI_API_KEY=sk-nope
COFFEE_API_KEY=unlimited
IMPOSTER_SYNDROME=enabled
CACHE_TTL=forever                 # i never forget a bad merge
SLEEP_HOURS=6                     # see swap in /etc/fstab
ADMIN_PASSWORD=                   # blank on purpose, like sundays`, { mode: '-rw-------' }),
  '/home/unikorm/projects': link('2026-10-03', '/opt'),

  // --- lost+found -------------------------------------------------------
  '/lost+found': dir('2021-11-30'),
  '/lost+found/#0001': file('2017-05-20',
`name:    yet another todo app
born:    2017-02
died:    2017-05
cause:   completed all of its todos. existential crisis.`),
  '/lost+found/#0002': file('2021-11-30',
`name:    the game (never named)
born:    2020-04
died:    2021-11
cause:   scope creep. survived by 14 branches.`),

  // --- media ------------------------------------------------------------
  '/media': dir('2026-10-01'),
  '/media/books': file('2026-10-01',
`# mounted read-only. currently open:

- (replace me) a book about systems
- (replace me) something not about computers`),
  '/media/music': file('2026-10-01',
`# on repeat while the build runs:

- (replace me) one album
- (replace me) one playlist, badly named`),
  '/media/games': file('2026-09-01',
`# not much. see /lost+found/#0002 for why.

- (replace me)`),

  // --- opt --------------------------------------------------------------
  '/opt': dir('2026-10-03'),
  '/opt/my_web': dir('2026-10-03'),
  '/opt/my_web/README.md': file('2026-10-03',
`my_web
======

this site. a shell, a filesystem, and nothing else.
source: https://github.com/unikorm/my_web`),
  '/opt/my_web/VERSION': file('2026-10-03', '0.3.0'),
  '/opt/my_web/CHANGELOG': file('2026-10-03',
`0.3.0  2026-10-03  the filesystem fills up. ls -l, man, free, friends.
0.2.0  2026-10-03  a filesystem. ls, cd, pwd, cat, tree.
0.1.0  2026-10-03  a prompt, a cursor, a vignette. four commands.
0.0.1  2026-09-24  a spec and an idea.`),
  '/opt/my_web/LINKS': file('2026-10-03',
`source   https://github.com/unikorm/my_web
live     https://unikorm.eu
spec     /usr/share/doc/my_web/ARCHITECTURE`),
  '/opt/momentkaph': dir('2026-09-28'),
  '/opt/momentkaph/README.md': file('2026-09-28',
`momentkaph
==========

a web app in two halves. (replace me: what it does, in one sentence)

backend    node 24, typescript, packaged as a tarball, served behind nginx
frontend   static, mirrored to the webspace over sftp
pipeline   github actions. push to main, wait, refresh, pray.`),
  '/opt/momentkaph/VERSION': file('2026-09-28', '1.0.0'),
  '/opt/momentkaph/CHANGELOG': file('2026-09-28',
`1.0.0  2026-09  ci/cd: build, hash the nginx configs, ship tarballs
0.9.0  2026-08  it runs on someone else's computer now
0.1.0  2026-05  it runs on my computer`),
  '/opt/momentkaph/LINKS': file('2026-09-28',
`source   https://github.com/unikorm
status   /proc/self/status`),

  // --- proc -------------------------------------------------------------
  '/proc': dir('2026-10-03'),
  '/proc/uptime': file('2026-10-03', '10 years since the first line of code'),
  '/proc/self': dir('2026-10-03'),
  '/proc/self/status': file('2026-10-03',
`Name:      unikorm
State:     R (running)
Role:      software developer        # (replace me)
Employer:  (replace me)
Threads:   3                         # work, side projects, sleep
Blocked:   waiting on ci
Open:      to interesting problems
Cpus_allowed:  1
Mems_allowed:  see free -h`),

  // --- root -------------------------------------------------------------
  '/root': dir('2016-09-01', { mode: 'drwx------', locked: true }),

  // --- srv --------------------------------------------------------------
  '/srv': dir('2026-10-03'),
  '/srv/README': file('2026-10-03',
`nothing is served from here.
the blog is in /var/log. try: ls -lt /var/log`),

  // --- tmp --------------------------------------------------------------
  '/tmp': dir('2026-10-03', { mode: 'drwxrwxrwt' }),
  '/tmp/ideas.txt': file('2026-10-03',
`# /tmp -- cleared on reboot. do not rely on anything in here.

- a cli that writes the commit message from the diff (surely exists)
- a blog post about why this site is a terminal
- a pomodoro that respects nice values
- rewrite everything in rust (no)`),

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
