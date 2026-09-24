# endtimes.dev — terminal personal site

Spec for Claude Code. Drop this in the repo root, keep it updated, and point every session at it.

---

## 0. Brief

A personal website that presents itself as a single Linux shell session. One URL, one
continuous scroll buffer, no page navigation. The visitor types commands; output appends
below. All content lives in a fake filesystem laid out like a real Ubuntu box, so exploring
the site is exploring a machine.

The metaphor is not decoration. `ls /var/log` really is the blog index because blog posts
really are dated log entries. If a path doesn't earn its meaning, don't use it.

### Hard constraints

- No runtime dependencies. No framework, no bundler, no CDN, no npm at runtime.
- No backend. Static hosting only.
- One route. `/` serves everything. Hash fragments are allowed for deep links (§9).
- Vanilla JS (ES2022 modules), vanilla CSS, semantic HTML.
- State lives in `localStorage`. Nothing critical depends on it (§8).
- Works without JS: `<noscript>` renders the full content as plain readable HTML (§10).

### Non-goals

- No login, no comments, no analytics, no cookie banner.
- No fake filesystem writes that pretend to be real (`rm -rf /` is a joke, not a feature).
- No emulation of a real shell. It's a curated set of commands, not bash.

---

## 1. End state (write this first, build backwards from it)

A stranger opens the site. Before they type anything they already see something worth
reading: the MOTD banner, a one-line identity, and three suggested commands. They type
`ls`, they type `whoami`, they misspell something and the shell guides them. Within two
minutes they know who this person is, what they've built, and what they think. They can
share a link to one blog post and it opens straight to it.

Success checks:

- A visitor who only ever types `help` still gets the whole site.
- A visitor who types plain English (`who are you`, `show me your writing`) gets somewhere.
- A visitor who knows Linux finds jokes rewarding them for knowing Linux.
- Nothing scrolls past that can't be scrolled back to.
- On a phone, the on-screen keyboard doesn't break the layout.

### Build order

1. **M1 — shell loop.** Input line, output buffer, history (arrow keys), `clear`, `help`.
   Hardcode two commands. Get the feel of typing right before anything else.
2. **M2 — VFS.** The path map and the node model. `ls`, `cd`, `pwd`, `cat`, `tree`.
3. **M3 — content.** Fill the tree with real content. This is the longest step and it's
   authoring, not coding.
4. **M4 — character commands.** `man`, `neofetch`, `dmesg`, `top`, `sudo`, `fortune`.
5. **M5 — persistence.** History, cwd, env, read-markers.
6. **M6 — intent resolver.** Natural language fallback.
7. **M7 — polish.** CRT treatment, reduced-motion, noscript fallback, deep links, a11y.

Ship after M4. M5–M7 are improvements to a site that already works.

---

## 2. Architecture

Four parts, strictly separated. The separation is the whole design; don't let them leak.

```
content/         pure data     the filesystem and everything in it
  └─ vfs.js      Map<path, Node>

core/
  ├─ fs.js       pure          resolve(), list(), read(), glob(), completion()
  ├─ shell.js    pure          parse(line) -> {cmd, args, flags}
  ├─ commands.js pure          Map<name, (argv, ctx) => Line[]>
  └─ session.js  effectful     cwd, env, history, localStorage

ui/
  ├─ term.js     effectful     append(Line[]), input handling, scroll
  └─ style.css
```

A command is a pure function: `(argv, ctx) => Line[]`. It never touches the DOM and never
writes to storage directly. It returns lines; the renderer prints them. This makes every
command trivially testable and makes the `noscript` build a for-loop over the same data.

### Node model

```js
/** @typedef {{
 *   path: string,
 *   type: 'dir' | 'file' | 'link' | 'device',
 *   mode: string,        // 'drwxr-xr-x'
 *   owner: string,       // 'root' | handle
 *   mtime: string,       // ISO date, drives `ls -lt` sorting
 *   target?: string,     // for links
 *   title?: string,      // human label used in indexes
 *   body?: string | (() => Line[]),  // file contents
 *   tags?: string[]
 * }} Node
 */
```

Flat `Map<string, Node>`. Directories are derived by prefix, not stored as child arrays, so
adding a blog post is one entry and nothing else changes.

### Line model

Output is data, not HTML strings.

```js
/** @typedef {{ text: string, tone?: 'dim'|'normal'|'bright'|'invert'|'warn', href?: string }} Span */
/** @typedef {{ spans: Span[], delay?: number }} Line */
```

The renderer is the only place that knows about `<span class="dim">`. Never build markup
inside a command.

---

## 3. The filesystem

This is the content model. Every section of a normal personal site maps to a path where
that content would actually live on a Linux box.

```
/
├── boot/
│   └── grub/grub.cfg         the choices that loaded this person (origin story)
├── dev/
│   ├── null                  things written here (dislikes, as a joke)
│   └── urandom               `cat /dev/urandom` -> one random thought, repeatable
├── etc/
│   ├── motd                  landing banner, auto-printed on boot
│   ├── hostname              endtimes.dev
│   ├── os-release            NAME / VERSION / BUILD_ID / HOME_URL — identity as key=value
│   ├── passwd                one-line identity, GECOS field holds name + city
│   ├── shells                languages and tools actually used
│   ├── fstab                 long-term commitments mounted at boot
│   ├── hosts                 people and sites worth visiting (the links page)
│   ├── aliases              contact routes: mail, git, social
│   ├── cron.d/               routines and habits, real crontab syntax
│   └── opinions.d/           OPINIONS — one .conf per topic (§3.1)
├── home/<handle>/
│   ├── .bashrc               aliases and shortcuts this person lives by
│   └── .plan                 finger-style: what's on my mind this week
├── lost+found/               abandoned projects, each with a cause of death
├── media/                    currently consuming: books, games, music
├── opt/<project>/            one dir per project: README, VERSION, CHANGELOG, LINKS
├── proc/
│   ├── self/status           current state: employer, role, what's blocked
│   └── uptime                years since the first line of code
├── root/                     permission denied (easter egg)
├── srv/                      nothing here. redirect to /var/log with a hint.
├── tmp/                      half-formed ideas, explicitly marked as unstable
├── usr/
│   ├── local/bin/            small tools built and actually used; `which`, `--help`
│   └── share/
│       ├── doc/<project>/    long-form writeups attached to projects
│       └── man/man1/         man pages, including the one for the author
├── var/
│   ├── games/                the playable thing (§6)
│   ├── log/                  BLOG — one file per post, named YYYY-MM-DD-slug
│   │   └── now               the /now page. `tail /var/log/now`
│   └── spool/                queued: what's next
```

Rules:

- Every directory that a visitor might `cd` into has something in it. No empty rooms.
- `mtime` on blog posts is the publish date, so `ls -lt /var/log` is a free reverse-chron
  index and needs no special-casing.
- Anything private is `/root` and answers with a real-looking permission error.

### 3.1 `/etc/opinions.d/`

The opinions section, in config-file format. One file per topic, real `.conf` syntax:
keys, values, comments, commented-out lines for positions that were abandoned.

```ini
# /etc/opinions.d/40-tooling.conf
# last modified 2026-04-02

TypeScript.strict           = always
TypeScript.enums            = never        # use unions
# Microservices             = default      # deprecated 2023, see CHANGELOG
Microservices               = when-org-chart-demands-it
DomainModel.before.schema   = true
Comments.explain            = why          # not what
```

Terse, opinionated, funny where it's honest. Numbered prefixes (`10-`, `40-`) because
that's how `conf.d` directories actually sort, not as decoration.

---

## 4. Commands

Grouped by what they're for. Each returns `Line[]`.

**Navigation** — `ls` (`-l`, `-a`, `-t`, `-h`), `cd` (incl. `-`, `..`, `~`), `pwd`, `tree`,
`find <pattern>`, `grep <pattern> <path>`.

**Reading** — `cat`, `less`/`more` (alias to `cat`), `head -n`, `tail -n`, `man <topic>`,
`file`, `which`, `stat`.

**Identity** — `whoami`, `id`, `uname -a`, `hostname`, `uptime`, `neofetch`, `finger`.

**System** — `dmesg`, `top`/`ps aux`, `df -h`, `free -h`, `history`, `date`, `env`, `alias`.

**Shell** — `help`, `clear`, `echo`, `exit`, `theme <green|amber|white>`, `set <key> <val>`.

**Jokes that must exist** — `sudo <anything>` → the real sudoers line with
"This incident has been reported."; `rm -rf /` → a beat, then a refusal with personality;
`vim` → "to exit, close the tab"; `exit` → logout banner then a re-login prompt; `fortune`;
`cowsay`.

### Signature commands

These are the ones people will screenshot. Spend effort here.

**`neofetch`** — the hero. ASCII portrait or logo on the left, stats on the right: OS
(name + age), host, kernel (whatever you run), uptime, shell, packages (projects shipped),
memory (what's currently occupying attention). This is the about page and it fits on one
screen.

**`man <handle>`** — the real long-form bio, as a man page. `NAME`, `SYNOPSIS`,
`DESCRIPTION`, `OPTIONS` (how to work with this person), `ENVIRONMENT` (city, timezone,
working hours), `EXIT STATUS`, `BUGS` (honest flaws — this section is why the joke works),
`SEE ALSO`, `AUTHOR`. Man-page formatting: indented body, bold section heads, the
`NAME — one line summary` convention.

**`dmesg`** — the career and life timeline as kernel boot log. Monotonic timestamps in
brackets, terse lowercase lines, a couple of warnings, one `[  ok  ]`.

```
[    0.000000] kernel: booting endtimes 1.0
[  221.443801] input: first keyboard detected
[ 1096.552190] init: entered university runlevel 3
[ 1830.118344] WARNING: unhandled exception in career.plan, recovering
```

**`top`** — what's currently being worked on, as a process table. `%CPU` is attention
share and must sum to something believable. `STATE` column: `R` running, `S` sleeping,
`D` blocked on something external. This is the most honest "what I'm doing now" page
you can build.

---

## 5. Intent resolver

The mockup already has this ("resolving intent ..."). Keep it. Order of resolution:

1. Exact command match.
2. User-defined alias.
3. Path match (bare `/var/log` behaves as `cd /var/log`).
4. Fuzzy command match, Levenshtein ≤ 2 → `did you mean 'ls'? [y/n]`.
5. Keyword intent: match against a small table of phrase patterns → suggested command.
   `who are you` → `man <handle>`. `what do you do` → `top`. `writing`/`blog`/`posts` →
   `ls -lt /var/log`. `hire`/`contact`/`email` → `cat /etc/aliases`.
6. Nothing matched → print the six things it *does* understand. Never a bare error.

Show the resolution steps in dim text before the answer. It's honest UI and it teaches
the grammar. Keep it to two lines; don't fake a delay longer than ~250ms.

---

## 6. `/var/games/`

One small playable thing, self-contained in the buffer. Candidates, pick one:

- A text adventure through the author's own filesystem.
- `guess` — number guessing, in the style of a 1978 BASIC listing.
- A tiny roguelike rendered in box-drawing characters.

It must be finishable in under two minutes and it must not hijack the shell permanently:
`Ctrl-C` and `exit` always return to the prompt.

---

## 7. Content authoring

All content lives in `content/`, separate from `core/`. Adding a blog post must be one new
file plus one line in the index, never a code change.

Post format: plain text with a tiny inline markup subset so the renderer stays trivial.

```
--- 
path:  /var/log/2026-07-02-the-cursor-is-the-whole-interface
title: the cursor is the whole interface
date:  2026-07-02
tags:  [ui, terminals]
---

Body text, wrapped at 76 columns by the author, not by CSS.

  indented block for code

`inline` for emphasis, [text](/path) for links to other VFS nodes.
```

Wrap at 76 columns in the source. A terminal has hard columns; letting CSS reflow prose
destroys the illusion and breaks ASCII art. Set the buffer to a fixed 80ch measure on
desktop and scale the font down on narrow screens rather than reflowing.

---

## 8. Persistence

`localStorage`, namespaced, versioned, and entirely optional.

| Key | Contents | Cap |
|---|---|---|
| `term:v` | schema version integer | — |
| `term:history` | command strings, newest last | 200 entries |
| `term:cwd` | last directory | — |
| `term:env` | `{HANDLE, PHOSPHOR, SCANLINES, MOTION}` | — |
| `term:read` | paths already `cat`-ed, for `NEW` markers in `ls` | 500 |
| `term:aliases` | user-defined via `alias x='y'` | 50 |
| `term:first` | epoch of first visit | — |
| `term:visits` | visit count | — |

Rules:

- Every access wrapped in `try/catch`. Private browsing and disabled storage must degrade
  to an in-memory object with zero user-visible difference beyond forgetting.
- On `term:v` mismatch: wipe the namespace, don't migrate. It's a website.
- `term:first` and `term:visits` power a genuinely nice touch: `uptime` reports the
  *visitor's* session — `up 4 days, 2 users, load average: ...` on a return visit, and
  the MOTD says `last login: <date> from <a made-up tty>`.
- Never store anything a visitor would mind being stored. No text they typed beyond
  command history, no identifiers, no fingerprinting.
- `clear` clears the screen. `history -c` clears storage. Offer both, explicitly.

---

## 9. Deep links

One route, but a blog post has to be shareable.

- Reading a file calls `history.replaceState(null, '', '#' + path)`.
- On load, if `location.hash` is a valid path: print the MOTD, then auto-run
  `cat <path>` as though the visitor typed it, and leave them at a prompt in that
  directory. Don't skip the boot sequence; the arrival is the point.
- Invalid hash → normal boot, no error.
- No `pushState`, no router, no back-button behaviour to maintain.

---

## 10. No-JS fallback

Inside `<noscript>`, render the entire VFS as a plain nested `<article>` list with real
headings and real `<a href="#path">` anchors. Generate it at author time with a small Node
script into `index.html` (build-time only — still zero runtime dependencies).

This is not an accessibility fig leaf. It's how search engines index the site, how the
content survives, and how anyone can read a post without the theatre.

---

## 11. Visual direction

Take exact values from the exported mockup. Starting points:

```css
:root {
  --bg:        #050b07;   /* near-black with green in it, never pure #000 */
  --bg-glow:   #0a1a10;   /* radial vignette centre */
  --dim:       #2f6b42;   /* resolution steps, chrome, comments */
  --fg:        #4ade80;   /* body text */
  --bright:    #a7f3c0;   /* headings, matched input */
  --invert-bg: #4ade80;   /* selected/highlight block */
  --invert-fg: #05140a;
  --warn:      #d9a441;   /* amber, used almost never */
  --font: ui-monospace, 'SF Mono', 'IBM Plex Mono', Menlo, Consolas, monospace;
}
```

CRT treatment, all of it optional and all of it cheap:

- **Scanlines** — `repeating-linear-gradient` overlay, `pointer-events: none`, opacity
  driven by a CSS var so `set scanlines 0.3` works from the shell.
- **Phosphor glow** — `text-shadow: 0 0 2px currentColor` on `--fg`, stronger on `--bright`.
  One layer, not three. Overdone glow reads as a costume.
- **Vignette** — one radial gradient, darkening the corners maybe 30%.
- **Cursor** — solid block, 1.2s blink, and it must stop blinking while typing.
- **Curvature / barrel distortion** — skip it. It hurts legibility and everyone does it.

Motion budget: one orchestrated boot sequence on first load (MOTD types out at ~1200 baud,
then stops), and nothing else animated that the visitor didn't trigger. Typing effects on
every response get old in fifteen seconds. Subsequent visits skip the boot (`term:visits`).

`@media (prefers-reduced-motion: reduce)`: no typing, no blink, no scanline shimmer. Content
appears instantly. Same for `set motion off`.

The risk with this aesthetic is that "dark background, green monospace" is the most-copied
terminal look there is. What makes it not generic is fidelity: real command grammar, real
file modes, real `conf.d` numbering, real man-page sections, output that sorts and aligns
in actual columns. Every place the illusion is exact is a place the site earns its concept.
Every place it's approximate, it looks like a template.

---

## 12. Accessibility

- The output buffer is real DOM text, selectable and copyable.
- Output region is `aria-live="polite"`, `role="log"`.
- The input is a real `<input>` with a visible label for screen readers, focused on load
  and refocused on any click in the terminal area.
- Visible focus ring that isn't only a colour change.
- Contrast: `--dim` on `--bg` must still clear 4.5:1. Check it; period-accurate dim green
  usually fails.
- Full keyboard: ↑/↓ history, Tab completion for commands and paths, Ctrl-C to abort,
  Ctrl-L to clear, Ctrl-A/E line editing.
- Mobile: tapping anywhere focuses input; the prompt stays above the on-screen keyboard
  (`dvh` units, not `vh`); font scales down instead of reflowing.

---

## 13. Acceptance checklist

- [ ] Total JS under 50KB unminified. If it's bigger, something is over-built.
- [ ] Zero network requests after initial load.
- [ ] Lighthouse: 100 on accessibility, 100 on best practices.
- [ ] Works with `localStorage` throwing on every call.
- [ ] Works with JS disabled (plain, ugly, complete).
- [ ] Every path in §3 returns something worth reading.
- [ ] `help` alone gets a visitor to every section.
- [ ] Reads correctly at 360px wide.
- [ ] Tab completion doesn't leak paths under `/root`.