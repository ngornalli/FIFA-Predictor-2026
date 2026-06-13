export const TEAM_DATA = {
  'Mexico': { code: 'mx', fifa: 'MEX' },
  'South Africa': { code: 'za', fifa: 'RSA' },
  'South Korea': { code: 'kr', fifa: 'KOR' },
  'Czechia': { code: 'cz', fifa: 'CZE' },
  'Canada': { code: 'ca', fifa: 'CAN' },
  'Bosnia and Herzegovina': { code: 'ba', fifa: 'BIH' },
  'Qatar': { code: 'qa', fifa: 'QAT' },
  'Switzerland': { code: 'ch', fifa: 'SUI' },
  'Brazil': { code: 'br', fifa: 'BRA' },
  'Morocco': { code: 'ma', fifa: 'MAR' },
  'Haiti': { code: 'ht', fifa: 'HAI' },
  'Scotland': { code: 'gb-sct', fifa: 'SCO' },
  'United States': { code: 'us', fifa: 'USA' },
  'Paraguay': { code: 'py', fifa: 'PAR' },
  'Australia': { code: 'au', fifa: 'AUS' },
  'Turkiye': { code: 'tr', fifa: 'TUR' },
  'Germany': { code: 'de', fifa: 'GER' },
  'Curacao': { code: 'cw', fifa: 'CUW' },
  'Ivory Coast': { code: 'ci', fifa: 'CIV' },
  'Ecuador': { code: 'ec', fifa: 'ECU' },
  'Netherlands': { code: 'nl', fifa: 'NED' },
  'Japan': { code: 'jp', fifa: 'JPN' },
  'Sweden': { code: 'se', fifa: 'SWE' },
  'Tunisia': { code: 'tn', fifa: 'TUN' },
  'Belgium': { code: 'be', fifa: 'BEL' },
  'Egypt': { code: 'eg', fifa: 'EGY' },
  'Iran': { code: 'ir', fifa: 'IRN' },
  'New Zealand': { code: 'nz', fifa: 'NZL' },
  'Spain': { code: 'es', fifa: 'ESP' },
  'Cape Verde': { code: 'cv', fifa: 'CPV' },
  'Saudi Arabia': { code: 'sa', fifa: 'KSA' },
  'Uruguay': { code: 'uy', fifa: 'URU' },
  'France': { code: 'fr', fifa: 'FRA' },
  'Iraq': { code: 'iq', fifa: 'IRQ' },
  'Norway': { code: 'no', fifa: 'NOR' },
  'Senegal': { code: 'sn', fifa: 'SEN' },
  'Argentina': { code: 'ar', fifa: 'ARG' },
  'Algeria': { code: 'dz', fifa: 'ALG' },
  'Austria': { code: 'at', fifa: 'AUT' },
  'Jordan': { code: 'jo', fifa: 'JOR' },
  'Colombia': { code: 'co', fifa: 'COL' },
  'DR Congo': { code: 'cd', fifa: 'COD' },
  'Portugal': { code: 'pt', fifa: 'POR' },
  'Uzbekistan': { code: 'uz', fifa: 'UZB' },
  'Croatia': { code: 'hr', fifa: 'CRO' },
  'England': { code: 'gb-eng', fifa: 'ENG' },
  'Ghana': { code: 'gh', fifa: 'GHA' },
  'Panama': { code: 'pa', fifa: 'PAN' }
};

export function getTeamInfo(teamName) {
  const data = TEAM_DATA[teamName];
  if (!data) return { flag: null, fifa: teamName.substring(0, 3).toUpperCase() };
  return {
    flag: `https://flagcdn.com/w80/${data.code}.png`,
    fifa: data.fifa
  };
}
