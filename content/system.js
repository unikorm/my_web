// Everything that is not a file: what neofetch, top, free, df and uname show.

export const sys = {
  host:   'unikorm.eu',
  os:     'unikorm 6.9',
  kernel: '6.9.9-unikorm',
  arch:   'x86_64',
  boot:   '2020-09-01',          // first line of code; drives uptime
  load:   '0.42, 0.37, 0.31',
  shell:  'bash 5.2',
  cpu:    '1 x human brain @ 0.9GHz (boosts after coffee)',
  where:  'somewhere in .eu',
};

// top / ps. %CPU is attention share and sums to 100.
// S: R running, S sleeping, D blocked on something external.
export const procs = [
  { pid: 1,    user: 'root',    s: 'S', cpu: 2.0,  mem: 1.0,  time: '87600:00', cmd: 'systemd --user=unikorm' },
  { pid: 420,  user: 'unikorm', s: 'R', cpu: 38.0, mem: 22.0, time: '412:33',   cmd: 'node momentkaph/be' },
  { pid: 421,  user: 'unikorm', s: 'R', cpu: 27.0, mem: 14.0, time: '96:12',    cmd: 'bash unikorm.eu --build' },
  { pid: 1337, user: 'unikorm', s: 'D', cpu: 12.0, mem: 8.0,  time: '13:37',    cmd: 'git push (waiting on ci)' },
  { pid: 2048, user: 'unikorm', s: 'S', cpu: 9.0,  mem: 20.0, time: '1:02',     cmd: 'read /media/books' },
  { pid: 4096, user: 'unikorm', s: 'S', cpu: 7.0,  mem: 30.0, time: '0:00',     cmd: 'sleep 28800 (requested 8h, granted 6h)' },
  { pid: 9000, user: 'unikorm', s: 'R', cpu: 5.0,  mem: 5.0,  time: '2:15',     cmd: 'vim /tmp/ideas.txt' },
];

// free. MiB.
export const mem = {
  total: 16384, used: 11264, free: 1229, shared: 512, cache: 3891, available: 4608,
  swapTotal: 2048, swapUsed: 1536, swapFree: 512,
};

// df -h
export const disks = [
  ['/dev/coffee',        '24h',  '16h',  '8.0h', '67%', '/'],
  ['/dev/family',        '168h', '40h',  '128h', '24%', '/home'],
  ['/dev/side_projects', '14',   '2',    '12',   '14%', '/opt'],
  ['/dev/music',         '64G',  '61G',  '3.0G', '96%', '/media'],
  ['tmpfs',              '8.0G', '7.9G', '100M', '99%', '/tmp'],
  ['/dev/sleep',         '8.0h', '6.0h', '2.0h', '75%', '/proc/self'],
];
