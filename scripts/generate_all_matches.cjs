const fs = require('fs');

const groups = {
  A: ['Mexico', 'South Africa', 'South Korea', 'Czechia'],
  B: ['Canada', 'Bosnia and Herzegovina', 'Qatar', 'Switzerland'],
  C: ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
  D: ['United States', 'Paraguay', 'Australia', 'Turkiye'],
  E: ['Germany', 'Curacao', 'Ivory Coast', 'Ecuador'],
  F: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
  G: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
  H: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
  I: ['France', 'Iraq', 'Norway', 'Senegal'],
  J: ['Argentina', 'Algeria', 'Austria', 'Jordan'],
  K: ['Colombia', 'DR Congo', 'Portugal', 'Uzbekistan'],
  L: ['Croatia', 'England', 'Ghana', 'Panama']
};

let sql = `INSERT INTO public.matches (home_team, away_team, kickoff_time, stage, multiplier) VALUES\n`;
let values = [];

let baseDate = new Date('2026-06-11T12:00:00Z');

// 72 Group Stage Matches
for (const [groupName, teams] of Object.entries(groups)) {
  const matchups = [
    [0, 1], [2, 3],
    [0, 2], [1, 3],
    [0, 3], [1, 2]
  ];

  matchups.forEach(m => {
    const t1 = teams[m[0]];
    const t2 = teams[m[1]];
    const dateStr = baseDate.toISOString().replace('T', ' ').substring(0, 19) + '+00';
    values.push(`('${t1}', '${t2}', '${dateStr}', 'Group', 1)`);
    baseDate.setHours(baseDate.getHours() + 4);
  });
}

baseDate = new Date('2026-06-28T12:00:00Z');

// 16 Round of 32 Matches
for(let i=1; i<=16; i++) {
  const dateStr = baseDate.toISOString().replace('T', ' ').substring(0, 19) + '+00';
  values.push(`('TBD R32 Home ${i}', 'TBD R32 Away ${i}', '${dateStr}', 'R32', 1)`);
  baseDate.setHours(baseDate.getHours() + 4);
}

baseDate = new Date('2026-07-04T12:00:00Z');

// 8 Round of 16 Matches
for(let i=1; i<=8; i++) {
  const dateStr = baseDate.toISOString().replace('T', ' ').substring(0, 19) + '+00';
  values.push(`('TBD R16 Home ${i}', 'TBD R16 Away ${i}', '${dateStr}', 'R16', 1)`);
  baseDate.setHours(baseDate.getHours() + 6);
}

baseDate = new Date('2026-07-09T12:00:00Z');

// 4 Quarterfinals Matches
for(let i=1; i<=4; i++) {
  const dateStr = baseDate.toISOString().replace('T', ' ').substring(0, 19) + '+00';
  values.push(`('TBD QF Home ${i}', 'TBD QF Away ${i}', '${dateStr}', 'QF', 1)`);
  baseDate.setDate(baseDate.getDate() + 1);
}

baseDate = new Date('2026-07-14T19:00:00Z');

// 2 Semifinals Matches
for(let i=1; i<=2; i++) {
  const dateStr = baseDate.toISOString().replace('T', ' ').substring(0, 19) + '+00';
  values.push(`('TBD SF Home ${i}', 'TBD SF Away ${i}', '${dateStr}', 'SF', 1)`);
  baseDate.setDate(baseDate.getDate() + 1);
}

// 3rd Place Match
baseDate = new Date('2026-07-18T19:00:00Z');
let dateStr = baseDate.toISOString().replace('T', ' ').substring(0, 19) + '+00';
values.push(`('TBD 3rd Home', 'TBD 3rd Away', '${dateStr}', '3rd', 1)`);

// Final Match
baseDate = new Date('2026-07-19T19:00:00Z');
dateStr = baseDate.toISOString().replace('T', ' ').substring(0, 19) + '+00';
values.push(`('TBD Final Home', 'TBD Final Away', '${dateStr}', 'Final', 2)`);

sql += values.join(',\n') + ';';

// Write to an artifact
fs.writeFileSync('C:\\Users\\s1270165\\.gemini\\antigravity\\brain\\e4c4a66d-e7f0-4bfd-95b7-d2b3d9baec22\\seed_all_matches.sql', sql);
