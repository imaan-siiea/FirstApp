/**
 * Current US Senators and Governors for all 50 states.
 * Updated for 119th Congress / 2025 officeholders.
 * US Senator photos sourced from bioguide.congress.gov when bioguideId is present.
 */

export interface FederalSenator {
  name: string
  party: 'Republican' | 'Democratic' | 'Independent'
  bioguideId?: string   // for photo URL
  upIn2026: boolean     // Class 2 seat up in 2026 midterms
}

export interface FederalGovernor {
  name: string
  party: 'Republican' | 'Democratic' | 'Independent'
  wikiSlug: string   // Wikipedia article title for photo lookup
}

export interface FederalOfficials {
  senators: [FederalSenator, FederalSenator]
  governor: FederalGovernor
}

export const FEDERAL_OFFICIALS: Record<string, FederalOfficials> = {
  AL: {
    senators: [
      { name: 'Tommy Tuberville', party: 'Republican', bioguideId: 'T000278', upIn2026: false },
      { name: 'Katie Britt',      party: 'Republican', bioguideId: 'B001319', upIn2026: false },
    ],
    governor: { name: 'Kay Ivey', party: 'Republican', wikiSlug: 'Kay_Ivey' },
  },
  AK: {
    senators: [
      { name: 'Dan Sullivan',   party: 'Republican',  bioguideId: 'S001198', upIn2026: true  },
      { name: 'Lisa Murkowski', party: 'Republican',  bioguideId: 'M001153', upIn2026: false },
    ],
    governor: { name: 'Mike Dunleavy', party: 'Republican', wikiSlug: 'Mike_Dunleavy' },
  },
  AZ: {
    senators: [
      { name: 'Mark Kelly',    party: 'Democratic', bioguideId: 'K000377', upIn2026: false },
      { name: 'Ruben Gallego', party: 'Democratic', bioguideId: 'G000574', upIn2026: false },
    ],
    governor: { name: 'Katie Hobbs', party: 'Democratic', wikiSlug: 'Katie_Hobbs' },
  },
  AR: {
    senators: [
      { name: 'John Boozman', party: 'Republican', bioguideId: 'B001236', upIn2026: true  },
      { name: 'Tom Cotton',   party: 'Republican', bioguideId: 'C001095', upIn2026: false },
    ],
    governor: { name: 'Sarah Huckabee Sanders', party: 'Republican', wikiSlug: 'Sarah_Huckabee_Sanders' },
  },
  CA: {
    senators: [
      { name: 'Alex Padilla', party: 'Democratic', bioguideId: 'P000145', upIn2026: false },
      { name: 'Adam Schiff',  party: 'Democratic', bioguideId: 'S001150', upIn2026: false },
    ],
    governor: { name: 'Gavin Newsom', party: 'Democratic', wikiSlug: 'Gavin_Newsom' },
  },
  CO: {
    senators: [
      { name: 'Michael Bennet',     party: 'Democratic', bioguideId: 'B001267', upIn2026: true  },
      { name: 'John Hickenlooper',  party: 'Democratic', bioguideId: 'H001082', upIn2026: false },
    ],
    governor: { name: 'Jared Polis', party: 'Democratic', wikiSlug: 'Jared_Polis' },
  },
  CT: {
    senators: [
      { name: 'Chris Murphy',       party: 'Democratic', bioguideId: 'M001169', upIn2026: false },
      { name: 'Richard Blumenthal', party: 'Democratic', bioguideId: 'B001277', upIn2026: false },
    ],
    governor: { name: 'Ned Lamont', party: 'Democratic', wikiSlug: 'Ned_Lamont' },
  },
  DE: {
    senators: [
      { name: 'Lisa Blunt Rochester', party: 'Democratic', bioguideId: 'B001303', upIn2026: false },
      { name: 'Chris Coons',          party: 'Democratic', bioguideId: 'C001088', upIn2026: false },
    ],
    governor: { name: 'Matt Meyer', party: 'Democratic', wikiSlug: 'Matt_Meyer_(politician)' },
  },
  FL: {
    senators: [
      { name: 'Rick Scott',    party: 'Republican', bioguideId: 'S001217', upIn2026: false },
      { name: 'Ashley Moody', party: 'Republican', upIn2026: false },
    ],
    governor: { name: 'Ron DeSantis', party: 'Republican', wikiSlug: 'Ron_DeSantis' },
  },
  GA: {
    senators: [
      { name: 'Jon Ossoff',      party: 'Democratic', bioguideId: 'O000170', upIn2026: true  },
      { name: 'Raphael Warnock', party: 'Democratic', bioguideId: 'W000790', upIn2026: false },
    ],
    governor: { name: 'Brian Kemp', party: 'Republican', wikiSlug: 'Brian_Kemp' },
  },
  HI: {
    senators: [
      { name: 'Mazie Hirono', party: 'Democratic', bioguideId: 'H001042', upIn2026: false },
      { name: 'Brian Schatz', party: 'Democratic', bioguideId: 'S001194', upIn2026: false },
    ],
    governor: { name: 'Josh Green', party: 'Democratic', wikiSlug: 'Josh_Green_(politician)' },
  },
  ID: {
    senators: [
      { name: 'James Risch', party: 'Republican', bioguideId: 'R000584', upIn2026: true  },
      { name: 'Mike Crapo',  party: 'Republican', bioguideId: 'C000880', upIn2026: false },
    ],
    governor: { name: 'Brad Little', party: 'Republican', wikiSlug: 'Brad_Little' },
  },
  IL: {
    senators: [
      { name: 'Dick Durbin',      party: 'Democratic', bioguideId: 'D000563', upIn2026: true  },
      { name: 'Tammy Duckworth', party: 'Democratic', bioguideId: 'D000622', upIn2026: false },
    ],
    governor: { name: 'JB Pritzker', party: 'Democratic', wikiSlug: 'J._B._Pritzker' },
  },
  IN: {
    senators: [
      { name: 'Todd Young', party: 'Republican', bioguideId: 'Y000064', upIn2026: false },
      { name: 'Jim Banks',  party: 'Republican', bioguideId: 'B001294', upIn2026: false },
    ],
    governor: { name: 'Mike Braun', party: 'Republican', wikiSlug: 'Mike_Braun' },
  },
  IA: {
    senators: [
      { name: 'Chuck Grassley', party: 'Republican', bioguideId: 'G000386', upIn2026: true  },
      { name: 'Joni Ernst',     party: 'Republican', bioguideId: 'E000295', upIn2026: false },
    ],
    governor: { name: 'Kim Reynolds', party: 'Republican', wikiSlug: 'Kim_Reynolds' },
  },
  KS: {
    senators: [
      { name: 'Jerry Moran',    party: 'Republican', bioguideId: 'M000934', upIn2026: true  },
      { name: 'Roger Marshall', party: 'Republican', bioguideId: 'M001198', upIn2026: false },
    ],
    governor: { name: 'Laura Kelly', party: 'Democratic', wikiSlug: 'Laura_Kelly' },
  },
  KY: {
    senators: [
      { name: 'Rand Paul',       party: 'Republican', bioguideId: 'P000603', upIn2026: true  },
      { name: 'Mitch McConnell', party: 'Republican', bioguideId: 'M000355', upIn2026: false },
    ],
    governor: { name: 'Andy Beshear', party: 'Democratic', wikiSlug: 'Andy_Beshear' },
  },
  LA: {
    senators: [
      { name: 'Bill Cassidy',  party: 'Republican', bioguideId: 'C001075', upIn2026: true  },
      { name: 'John Kennedy',  party: 'Republican', bioguideId: 'K000393', upIn2026: false },
    ],
    governor: { name: 'Jeff Landry', party: 'Republican', wikiSlug: 'Jeff_Landry' },
  },
  ME: {
    senators: [
      { name: 'Susan Collins', party: 'Republican',  bioguideId: 'C001035', upIn2026: true  },
      { name: 'Angus King',    party: 'Independent', bioguideId: 'K000383', upIn2026: false },
    ],
    governor: { name: 'Janet Mills', party: 'Democratic', wikiSlug: 'Janet_Mills' },
  },
  MD: {
    senators: [
      { name: 'Angela Alsobrooks', party: 'Democratic', bioguideId: 'A000379', upIn2026: false },
      { name: 'Chris Van Hollen',  party: 'Democratic', bioguideId: 'V000128', upIn2026: false },
    ],
    governor: { name: 'Wes Moore', party: 'Democratic', wikiSlug: 'Wes_Moore' },
  },
  MA: {
    senators: [
      { name: 'Elizabeth Warren', party: 'Democratic', bioguideId: 'W000817', upIn2026: false },
      { name: 'Ed Markey',        party: 'Democratic', bioguideId: 'M000133', upIn2026: false },
    ],
    governor: { name: 'Maura Healey', party: 'Democratic', wikiSlug: 'Maura_Healey' },
  },
  MI: {
    senators: [
      { name: 'Elissa Slotkin', party: 'Democratic', bioguideId: 'S001208', upIn2026: false },
      { name: 'Gary Peters',    party: 'Democratic', bioguideId: 'P000595', upIn2026: false },
    ],
    governor: { name: 'Gretchen Whitmer', party: 'Democratic', wikiSlug: 'Gretchen_Whitmer' },
  },
  MN: {
    senators: [
      { name: 'Amy Klobuchar', party: 'Democratic', bioguideId: 'K000367', upIn2026: false },
      { name: 'Tina Smith',    party: 'Democratic', bioguideId: 'S001203', upIn2026: false },
    ],
    governor: { name: 'Tim Walz', party: 'Democratic', wikiSlug: 'Tim_Walz' },
  },
  MS: {
    senators: [
      { name: 'Roger Wicker',    party: 'Republican', bioguideId: 'W000437', upIn2026: false },
      { name: 'Cindy Hyde-Smith', party: 'Republican', bioguideId: 'H001079', upIn2026: false },
    ],
    governor: { name: 'Tate Reeves', party: 'Republican', wikiSlug: 'Tate_Reeves' },
  },
  MO: {
    senators: [
      { name: 'Josh Hawley',  party: 'Republican', bioguideId: 'H001089', upIn2026: false },
      { name: 'Eric Schmitt', party: 'Republican', bioguideId: 'S001227', upIn2026: false },
    ],
    governor: { name: 'Mike Kehoe', party: 'Republican', wikiSlug: 'Mike_Kehoe' },
  },
  MT: {
    senators: [
      { name: 'Steve Daines', party: 'Republican', bioguideId: 'D000618', upIn2026: false },
      { name: 'Tim Sheehy',   party: 'Republican', upIn2026: false },
    ],
    governor: { name: 'Greg Gianforte', party: 'Republican', wikiSlug: 'Greg_Gianforte' },
  },
  NE: {
    senators: [
      { name: 'Deb Fischer',   party: 'Republican', bioguideId: 'F000463', upIn2026: false },
      { name: 'Pete Ricketts', party: 'Republican', bioguideId: 'R000617', upIn2026: false },
    ],
    governor: { name: 'Jim Pillen', party: 'Republican', wikiSlug: 'Jim_Pillen' },
  },
  NV: {
    senators: [
      { name: 'Catherine Cortez Masto', party: 'Democratic', bioguideId: 'C001113', upIn2026: true  },
      { name: 'Jacky Rosen',            party: 'Democratic', bioguideId: 'R000608', upIn2026: false },
    ],
    governor: { name: 'Joe Lombardo', party: 'Republican', wikiSlug: 'Joe_Lombardo' },
  },
  NH: {
    senators: [
      { name: 'Jeanne Shaheen', party: 'Democratic', bioguideId: 'S001181', upIn2026: true  },
      { name: 'Maggie Hassan',  party: 'Democratic', bioguideId: 'H001076', upIn2026: false },
    ],
    governor: { name: 'Kelly Ayotte', party: 'Republican', wikiSlug: 'Kelly_Ayotte' },
  },
  NJ: {
    senators: [
      { name: 'Cory Booker', party: 'Democratic', bioguideId: 'B001288', upIn2026: true  },
      { name: 'Andy Kim',    party: 'Democratic', bioguideId: 'K000394', upIn2026: false },
    ],
    governor: { name: 'Phil Murphy', party: 'Democratic', wikiSlug: 'Phil_Murphy' },
  },
  NM: {
    senators: [
      { name: 'Martin Heinrich', party: 'Democratic', bioguideId: 'H001046', upIn2026: true  },
      { name: 'Ben Ray Luján',   party: 'Democratic', bioguideId: 'L000570', upIn2026: false },
    ],
    governor: { name: 'Michelle Lujan Grisham', party: 'Democratic', wikiSlug: 'Michelle_Lujan_Grisham' },
  },
  NY: {
    senators: [
      { name: 'Chuck Schumer',    party: 'Democratic', bioguideId: 'S000148', upIn2026: true  },
      { name: 'Kirsten Gillibrand', party: 'Democratic', bioguideId: 'G000555', upIn2026: false },
    ],
    governor: { name: 'Kathy Hochul', party: 'Democratic', wikiSlug: 'Kathy_Hochul' },
  },
  NC: {
    senators: [
      { name: 'Thom Tillis', party: 'Republican', bioguideId: 'T000476', upIn2026: true  },
      { name: 'Ted Budd',    party: 'Republican', bioguideId: 'B001305', upIn2026: false },
    ],
    governor: { name: 'Josh Stein', party: 'Democratic', wikiSlug: 'Josh_Stein' },
  },
  ND: {
    senators: [
      { name: 'John Hoeven',  party: 'Republican', bioguideId: 'H001061', upIn2026: false },
      { name: 'Kevin Cramer', party: 'Republican', bioguideId: 'C001096', upIn2026: false },
    ],
    governor: { name: 'Kelly Armstrong', party: 'Republican', wikiSlug: 'Kelly_Armstrong_(politician)' },
  },
  OH: {
    senators: [
      { name: 'Bernie Moreno', party: 'Republican', upIn2026: false },
      { name: 'Jon Husted',    party: 'Republican', upIn2026: false },
    ],
    governor: { name: 'Mike DeWine', party: 'Republican', wikiSlug: 'Mike_DeWine' },
  },
  OK: {
    senators: [
      { name: 'James Lankford',    party: 'Republican', bioguideId: 'L000575', upIn2026: true  },
      { name: 'Markwayne Mullin',  party: 'Republican', bioguideId: 'M001190', upIn2026: false },
    ],
    governor: { name: 'Kevin Stitt', party: 'Republican', wikiSlug: 'Kevin_Stitt' },
  },
  OR: {
    senators: [
      { name: 'Ron Wyden',    party: 'Democratic', bioguideId: 'W000779', upIn2026: true  },
      { name: 'Jeff Merkley', party: 'Democratic', bioguideId: 'M001176', upIn2026: false },
    ],
    governor: { name: 'Tina Kotek', party: 'Democratic', wikiSlug: 'Tina_Kotek' },
  },
  PA: {
    senators: [
      { name: 'Dave McCormick', party: 'Republican', upIn2026: false },
      { name: 'John Fetterman', party: 'Democratic', bioguideId: 'F000479', upIn2026: false },
    ],
    governor: { name: 'Josh Shapiro', party: 'Democratic', wikiSlug: 'Josh_Shapiro' },
  },
  RI: {
    senators: [
      { name: 'Jack Reed',         party: 'Democratic', bioguideId: 'R000122', upIn2026: false },
      { name: 'Sheldon Whitehouse', party: 'Democratic', bioguideId: 'W000802', upIn2026: false },
    ],
    governor: { name: 'Dan McKee', party: 'Democratic', wikiSlug: 'Dan_McKee' },
  },
  SC: {
    senators: [
      { name: 'Lindsey Graham', party: 'Republican', bioguideId: 'G000359', upIn2026: false },
      { name: 'Tim Scott',      party: 'Republican', bioguideId: 'S001184', upIn2026: true  },
    ],
    governor: { name: 'Henry McMaster', party: 'Republican', wikiSlug: 'Henry_McMaster' },
  },
  SD: {
    senators: [
      { name: 'John Thune',  party: 'Republican', bioguideId: 'T000250', upIn2026: true  },
      { name: 'Mike Rounds', party: 'Republican', bioguideId: 'R000605', upIn2026: false },
    ],
    governor: { name: 'Kristi Noem', party: 'Republican', wikiSlug: 'Kristi_Noem' },
  },
  TN: {
    senators: [
      { name: 'Marsha Blackburn', party: 'Republican', bioguideId: 'B001243', upIn2026: true  },
      { name: 'Bill Hagerty',     party: 'Republican', bioguideId: 'H001085', upIn2026: false },
    ],
    governor: { name: 'Bill Lee', party: 'Republican', wikiSlug: 'Bill_Lee_(Tennessee_politician)' },
  },
  TX: {
    senators: [
      { name: 'John Cornyn', party: 'Republican', bioguideId: 'C001056', upIn2026: true  },
      { name: 'Ted Cruz',    party: 'Republican', bioguideId: 'C001098', upIn2026: false },
    ],
    governor: { name: 'Greg Abbott', party: 'Republican', wikiSlug: 'Greg_Abbott' },
  },
  UT: {
    senators: [
      { name: 'Mike Lee',    party: 'Republican', bioguideId: 'L000577', upIn2026: true  },
      { name: 'John Curtis', party: 'Republican', bioguideId: 'C001114', upIn2026: false },
    ],
    governor: { name: 'Spencer Cox', party: 'Republican', wikiSlug: 'Spencer_Cox_(politician)' },
  },
  VT: {
    senators: [
      { name: 'Peter Welch',  party: 'Democratic',  bioguideId: 'W000800', upIn2026: false },
      { name: 'Bernie Sanders', party: 'Independent', bioguideId: 'S000033', upIn2026: false },
    ],
    governor: { name: 'Phil Scott', party: 'Republican', wikiSlug: 'Phil_Scott' },
  },
  VA: {
    senators: [
      { name: 'Mark Warner', party: 'Democratic', bioguideId: 'W000805', upIn2026: true  },
      { name: 'Tim Kaine',   party: 'Democratic', bioguideId: 'K000384', upIn2026: false },
    ],
    governor: { name: 'Glenn Youngkin', party: 'Republican', wikiSlug: 'Glenn_Youngkin' },
  },
  WA: {
    senators: [
      { name: 'Maria Cantwell', party: 'Democratic', bioguideId: 'C000127', upIn2026: false },
      { name: 'Patty Murray',   party: 'Democratic', bioguideId: 'M001111', upIn2026: false },
    ],
    governor: { name: 'Bob Ferguson', party: 'Democratic', wikiSlug: 'Bob_Ferguson_(politician)' },
  },
  WV: {
    senators: [
      { name: 'Shelley Moore Capito', party: 'Republican', bioguideId: 'C001047', upIn2026: false },
      { name: 'Jim Justice',          party: 'Republican', upIn2026: false },
    ],
    governor: { name: 'Patrick Morrisey', party: 'Republican', wikiSlug: 'Patrick_Morrisey' },
  },
  WI: {
    senators: [
      { name: 'Tammy Baldwin', party: 'Democratic', bioguideId: 'B001230', upIn2026: true  },
      { name: 'Ron Johnson',   party: 'Republican', bioguideId: 'J000293', upIn2026: false },
    ],
    governor: { name: 'Tony Evers', party: 'Democratic', wikiSlug: 'Tony_Evers' },
  },
  WY: {
    senators: [
      { name: 'John Barrasso',  party: 'Republican', bioguideId: 'B001261', upIn2026: false },
      { name: 'Cynthia Lummis', party: 'Republican', bioguideId: 'L000571', upIn2026: false },
    ],
    governor: { name: 'Mark Gordon', party: 'Republican', wikiSlug: 'Mark_Gordon_(Wyoming_politician)' },
  },
}

/** Returns the bioguide photo URL for a senator, or null if no ID available. */
export function getSenatorPhotoUrl(bioguideId?: string): string | null {
  if (!bioguideId) return null
  return `https://bioguide.congress.gov/bioguide/photo/${bioguideId[0]}/${bioguideId}.jpg`
}
