export interface StateRegistrationGuide {
  stateCode: string;
  stateName: string;
  deadline: {
    online: string;
    mail: string;
    inPerson: string;
  };
  methods: {
    online?: { url: string; available: true };
    mail: { available: true; instructions: string };
    inPerson: { available: true; instructions: string };
  };
  officialUrl: string;
  checkRegistrationUrl?: string;
  idRequired: string;
}

export const STATE_REGISTRATION: Record<string, StateRegistrationGuide> = {
  AL: {
    stateCode: 'AL',
    stateName: 'Alabama',
    deadline: {
      online: '15 days before election',
      mail: '15 days before election',
      inPerson: '15 days before election',
    },
    methods: {
      online: { url: 'https://www.alabamavotes.gov/RegisterToVote.aspx', available: true },
      mail: {
        available: true,
        instructions:
          'Download the National Voter Registration Form or Alabama form. Mail to your county Board of Registrars. Must be postmarked 15 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county Board of Registrars office. Bring a valid Alabama driver license or non-driver ID, or the last four digits of your SSN.',
      },
    },
    officialUrl: 'https://www.alabamavotes.gov',
    checkRegistrationUrl: 'https://myinfo.alabamavotes.gov/VoterView',
    idRequired:
      'Alabama driver license or non-driver ID number, or last four digits of SSN. First-time voters may need to show photo ID at the polls.',
  },

  AK: {
    stateCode: 'AK',
    stateName: 'Alaska',
    deadline: {
      online: '30 days before election',
      mail: '30 days before election',
      inPerson: '30 days before election',
    },
    methods: {
      online: { url: 'https://voterregistration.alaska.gov', available: true },
      mail: {
        available: true,
        instructions:
          'Download and complete the Alaska Voter Registration Application. Mail to the Division of Elections. Must be received 30 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit the Division of Elections office or any state agency offering voter registration. Deadline is 30 days before election.',
      },
    },
    officialUrl: 'https://www.elections.alaska.gov',
    checkRegistrationUrl: 'https://myvoterinformation.alaska.gov',
    idRequired:
      'Alaska driver license or state ID number, or last four digits of SSN. Must be a U.S. citizen and Alaska resident.',
  },

  AZ: {
    stateCode: 'AZ',
    stateName: 'Arizona',
    deadline: {
      online: '29 days before election',
      mail: '29 days before election',
      inPerson: '29 days before election',
    },
    methods: {
      online: { url: 'https://servicearizona.com/voterRegistration', available: true },
      mail: {
        available: true,
        instructions:
          'Complete the Arizona Voter Registration Form and mail to your county recorder. Must be postmarked 29 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county recorder\'s office or any MVD office. Bring proof of citizenship (e.g., U.S. passport or birth certificate) and proof of Arizona residency.',
      },
    },
    officialUrl: 'https://azsos.gov/elections/voter-registration',
    checkRegistrationUrl: 'https://my.arizona.vote/WhereToVote.aspx',
    idRequired:
      'Proof of U.S. citizenship required (passport, birth certificate, or naturalization document). Arizona driver license or ID number also needed.',
  },

  AR: {
    stateCode: 'AR',
    stateName: 'Arkansas',
    deadline: {
      online: '30 days before election',
      mail: '30 days before election',
      inPerson: '30 days before election',
    },
    methods: {
      online: { url: 'https://www.sos.arkansas.gov/elections/voter-information/register-to-vote', available: true },
      mail: {
        available: true,
        instructions:
          'Download the Arkansas Voter Registration Application and mail to your county clerk. Must be postmarked 30 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county clerk\'s office. Bring a valid Arkansas driver license or ID, or the last four digits of your SSN. Deadline is 30 days before election.',
      },
    },
    officialUrl: 'https://www.sos.arkansas.gov/elections/voter-information',
    checkRegistrationUrl: 'https://www.voterview.ar-nova.org/voterview',
    idRequired:
      'Arkansas driver license or state ID number, or last four digits of SSN. Photo ID required at the polls.',
  },

  CA: {
    stateCode: 'CA',
    stateName: 'California',
    deadline: {
      online: '15 days before election',
      mail: '15 days before election',
      inPerson: 'Election Day (same-day registration available)',
    },
    methods: {
      online: { url: 'https://registertovote.ca.gov', available: true },
      mail: {
        available: true,
        instructions:
          'Complete and mail the California Voter Registration Form to your county elections office. Must be postmarked 15 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Conditional voter registration (same-day registration) is available at your county elections office or polling place through Election Day. You will vote a provisional ballot.',
      },
    },
    officialUrl: 'https://www.sos.ca.gov/elections/voter-registration',
    checkRegistrationUrl: 'https://voterstatus.sos.ca.gov',
    idRequired:
      'California driver license or ID number, or last four digits of SSN. First-time voters who registered by mail may need to show ID.',
  },

  CO: {
    stateCode: 'CO',
    stateName: 'Colorado',
    deadline: {
      online: '8 days before election',
      mail: '8 days before election',
      inPerson: 'Election Day (same-day registration available)',
    },
    methods: {
      online: { url: 'https://www.sos.state.co.us/voter/pages/pub/olvr/verifyNewVoter.xhtml', available: true },
      mail: {
        available: true,
        instructions:
          'Colorado mails ballots to all active registered voters. To register by mail, submit the form at least 8 days before the election. Mail to your county clerk.',
      },
      inPerson: {
        available: true,
        instructions:
          'Same-day registration is available at any voter service and polling center through Election Day. Bring proof of Colorado residency (e.g., driver license, utility bill).',
      },
    },
    officialUrl: 'https://www.sos.state.co.us/voter/pages/pub/home.xhtml',
    checkRegistrationUrl: 'https://www.sos.state.co.us/voter/pages/pub/olvr/verifyNewVoter.xhtml',
    idRequired:
      'Colorado driver license or ID number, or last four digits of SSN. For same-day registration, bring a document showing Colorado name and address.',
  },

  CT: {
    stateCode: 'CT',
    stateName: 'Connecticut',
    deadline: {
      online: '7 days before election',
      mail: '7 days before election',
      inPerson: 'Election Day (same-day registration available)',
    },
    methods: {
      online: { url: 'https://voterregistration.ct.gov/OLVR/welcome.do', available: true },
      mail: {
        available: true,
        instructions:
          'Mail the Connecticut Voter Registration Application to your town clerk. Must be received 7 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Election Day Registration (EDR) is available at your town clerk\'s office or designated polling location. Bring proof of Connecticut residency and identity (e.g., driver license, utility bill).',
      },
    },
    officialUrl: 'https://portal.ct.gov/SOTS/Election-Services/Voter-Information/Voter-Registration-Information',
    checkRegistrationUrl: 'https://portaldir.ct.gov/sots/LookUp.aspx',
    idRequired:
      'Connecticut driver license or ID number, or last four digits of SSN. For EDR, bring ID showing name and Connecticut address.',
  },

  DE: {
    stateCode: 'DE',
    stateName: 'Delaware',
    deadline: {
      online: '24 days before election',
      mail: '24 days before election',
      inPerson: '24 days before election',
    },
    methods: {
      online: { url: 'https://ivote.de.gov/VoterView/registrant/newregistrant', available: true },
      mail: {
        available: true,
        instructions:
          'Download and complete the Delaware Voter Registration Application. Mail to the State Election Commissioner. Must be received 24 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit the State Election Commissioner\'s office or your county Department of Elections. Bring a valid Delaware driver license or ID. Deadline is 24 days before election.',
      },
    },
    officialUrl: 'https://elections.delaware.gov',
    checkRegistrationUrl: 'https://ivote.de.gov/VoterView',
    idRequired:
      'Delaware driver license or ID number, or last four digits of SSN. First-time voters may need to show ID.',
  },

  FL: {
    stateCode: 'FL',
    stateName: 'Florida',
    deadline: {
      online: '29 days before election',
      mail: '29 days before election',
      inPerson: '29 days before election',
    },
    methods: {
      online: { url: 'https://registertovoteflorida.gov', available: true },
      mail: {
        available: true,
        instructions:
          'Complete the Florida Voter Registration Application and mail to your county supervisor of elections. Must be postmarked 29 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county supervisor of elections office. Bring a valid Florida driver license or ID, or the last four digits of your SSN. Deadline is 29 days before election.',
      },
    },
    officialUrl: 'https://dos.fl.gov/elections/for-voters/voter-registration',
    checkRegistrationUrl: 'https://registration.elections.myflorida.com/CheckVoterStatus',
    idRequired:
      'Florida driver license or state ID number, or last four digits of SSN. Photo ID required at the polls.',
  },

  GA: {
    stateCode: 'GA',
    stateName: 'Georgia',
    deadline: {
      online: '28 days before election',
      mail: '28 days before election',
      inPerson: '28 days before election',
    },
    methods: {
      online: { url: 'https://registertovote.sos.ga.gov', available: true },
      mail: {
        available: true,
        instructions:
          'Download the Georgia Voter Registration Application and mail to your county board of registrars. Must be postmarked 28 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county board of registrars or county elections office. Bring a valid Georgia driver license or ID. Deadline is 28 days before election.',
      },
    },
    officialUrl: 'https://sos.ga.gov/page/voter-registration-information',
    checkRegistrationUrl: 'https://mvp.sos.ga.gov',
    idRequired:
      'Georgia driver license or state ID number, or last four digits of SSN. Photo ID required to vote in person.',
  },

  HI: {
    stateCode: 'HI',
    stateName: 'Hawaii',
    deadline: {
      online: '10 days before election',
      mail: '30 days before election',
      inPerson: 'Election Day (same-day registration available)',
    },
    methods: {
      online: { url: 'https://olvr.hawaii.gov', available: true },
      mail: {
        available: true,
        instructions:
          'Complete the Hawaii Voter Registration Form and mail to your county clerk. Must be received 30 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Same-day registration available at any voter service center or polling place on Election Day. Bring proof of Hawaii residency and identity (e.g., Hawaii driver license).',
      },
    },
    officialUrl: 'https://elections.hawaii.gov',
    checkRegistrationUrl: 'https://olvr.hawaii.gov',
    idRequired:
      'Hawaii driver license or state ID number, or last four digits of SSN. Hawaii is a vote-by-mail state; all registered voters receive a ballot.',
  },

  ID: {
    stateCode: 'ID',
    stateName: 'Idaho',
    deadline: {
      online: '25 days before election',
      mail: '25 days before election',
      inPerson: 'Election Day (same-day registration available)',
    },
    methods: {
      online: { url: 'https://idahovotes.gov/voter-registration', available: true },
      mail: {
        available: true,
        instructions:
          'Download and complete the Idaho Voter Registration Form. Mail to your county clerk. Must be received 25 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Same-day registration is available at your county clerk\'s office or polling place on Election Day. Bring proof of Idaho residency (e.g., Idaho driver license, utility bill, or bank statement).',
      },
    },
    officialUrl: 'https://idahovotes.gov',
    checkRegistrationUrl: 'https://idahovotes.gov/voter-registration',
    idRequired:
      'Idaho driver license or state ID number, or last four digits of SSN. For Election Day registration, bring a document showing Idaho address.',
  },

  IL: {
    stateCode: 'IL',
    stateName: 'Illinois',
    deadline: {
      online: '28 days before election',
      mail: '28 days before election',
      inPerson: 'Election Day (same-day registration available)',
    },
    methods: {
      online: { url: 'https://ova.elections.il.gov', available: true },
      mail: {
        available: true,
        instructions:
          'Complete the Illinois Voter Registration Application and mail to your county clerk or Chicago Board of Election Commissioners. Must be postmarked 28 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Grace period registration (same-day registration) is available at your county clerk\'s office or designated polling site starting 28 days before the election through Election Day. Bring two proofs of Illinois residency.',
      },
    },
    officialUrl: 'https://www.elections.il.gov',
    checkRegistrationUrl: 'https://www.illinoisvoters.com',
    idRequired:
      'Illinois driver license or state ID number, or last four digits of SSN. Two proofs of current Illinois residence required for grace period registration.',
  },

  IN: {
    stateCode: 'IN',
    stateName: 'Indiana',
    deadline: {
      online: '29 days before election',
      mail: '29 days before election',
      inPerson: '29 days before election',
    },
    methods: {
      online: { url: 'https://indianavoters.in.gov', available: true },
      mail: {
        available: true,
        instructions:
          'Download and complete the Indiana Voter Registration Form. Mail to your county voter registration office. Must be postmarked 29 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county voter registration office or county clerk\'s office. Bring a valid Indiana driver license or ID. Deadline is 29 days before election.',
      },
    },
    officialUrl: 'https://www.in.gov/sos/elections/voter-information/register-to-vote',
    checkRegistrationUrl: 'https://indianavoters.in.gov',
    idRequired:
      'Indiana driver license or state ID number, or last four digits of SSN. Photo ID required at the polls.',
  },

  IA: {
    stateCode: 'IA',
    stateName: 'Iowa',
    deadline: {
      online: '15 days before election',
      mail: '15 days before election',
      inPerson: 'Election Day (same-day registration available)',
    },
    methods: {
      online: { url: 'https://sos.iowa.gov/elections/voterinformation/voterregistration.html', available: true },
      mail: {
        available: true,
        instructions:
          'Complete the Iowa Voter Registration Form and mail to your county auditor. Must be postmarked 15 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Same-day registration available at your polling place on Election Day. You must provide proof of identity and Iowa residency (e.g., Iowa driver license or ID showing current address).',
      },
    },
    officialUrl: 'https://sos.iowa.gov/elections/voterinformation/voterregistration.html',
    checkRegistrationUrl: 'https://sos.iowa.gov/elections/voterreg/regtovote/search.aspx',
    idRequired:
      'Iowa driver license or non-driver ID number, or last four digits of SSN. For same-day registration, provide photo ID with current address or two documents showing Iowa residency.',
  },

  KS: {
    stateCode: 'KS',
    stateName: 'Kansas',
    deadline: {
      online: '21 days before election',
      mail: '21 days before election',
      inPerson: '21 days before election',
    },
    methods: {
      online: { url: 'https://www.kdor.ks.gov/Apps/VoterReg/Default.aspx', available: true },
      mail: {
        available: true,
        instructions:
          'Complete the Kansas Voter Registration Form and mail to your county election office. Must be postmarked 21 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county election office. Bring a valid Kansas driver license or ID. Deadline is 21 days before election.',
      },
    },
    officialUrl: 'https://sos.ks.gov/elections/elections_votinginfo.html',
    checkRegistrationUrl: 'https://myvoteinfo.voteks.org/VoterView',
    idRequired:
      'Kansas driver license or state ID number, or last four digits of SSN. Proof of citizenship required (e.g., birth certificate or passport) for paper registration. Photo ID required at polls.',
  },

  KY: {
    stateCode: 'KY',
    stateName: 'Kentucky',
    deadline: {
      online: '21 days before election',
      mail: '21 days before election',
      inPerson: '21 days before election',
    },
    methods: {
      online: { url: 'https://vrsws.sos.ky.gov/ovrweb', available: true },
      mail: {
        available: true,
        instructions:
          'Download the Kentucky Voter Registration Application and mail to your county clerk. Must be postmarked 21 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county clerk\'s office. Bring a valid Kentucky driver license or ID. Deadline is 21 days before election.',
      },
    },
    officialUrl: 'https://elect.ky.gov/voters/pages/registration.aspx',
    checkRegistrationUrl: 'https://vrsws.sos.ky.gov/VIC',
    idRequired:
      'Kentucky driver license or state ID number, or last four digits of SSN. Photo ID required at the polls.',
  },

  LA: {
    stateCode: 'LA',
    stateName: 'Louisiana',
    deadline: {
      online: '30 days before election',
      mail: '30 days before election',
      inPerson: '30 days before election',
    },
    methods: {
      online: { url: 'https://voterportal.sos.la.gov', available: true },
      mail: {
        available: true,
        instructions:
          'Download and complete the Louisiana Voter Registration Application. Mail to the Secretary of State\'s office or your parish registrar. Must be postmarked 30 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your parish registrar of voters office. Bring a valid Louisiana driver license or ID. Deadline is 30 days before election.',
      },
    },
    officialUrl: 'https://www.sos.la.gov/ElectionsAndVoting/Pages/default.aspx',
    checkRegistrationUrl: 'https://voterportal.sos.la.gov',
    idRequired:
      'Louisiana driver license or state ID number, or last four digits of SSN. Photo ID required at the polls.',
  },

  ME: {
    stateCode: 'ME',
    stateName: 'Maine',
    deadline: {
      online: '21 days before election',
      mail: '21 days before election',
      inPerson: 'Election Day (same-day registration available)',
    },
    methods: {
      online: { url: 'https://www.maine.gov/sos/cec/elec/voter-info/voterguide.html', available: true },
      mail: {
        available: true,
        instructions:
          'Download and complete the Maine Voter Registration Application. Mail to your town or city clerk. Must be received 21 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Same-day registration is available at your local clerk\'s office or polling place on Election Day. Bring proof of identity and Maine residency (e.g., Maine driver license or ID with current address).',
      },
    },
    officialUrl: 'https://www.maine.gov/sos/cec/elec/voter-info/voterguide.html',
    checkRegistrationUrl: 'https://www.maine.gov/cgi-bin/online/AbsenteeBallot/index.pl',
    idRequired:
      'Maine driver license or state ID number, or last four digits of SSN. For Election Day registration, bring one document proving identity and Maine address.',
  },

  MD: {
    stateCode: 'MD',
    stateName: 'Maryland',
    deadline: {
      online: '21 days before election',
      mail: '21 days before election',
      inPerson: 'Election Day (same-day registration available)',
    },
    methods: {
      online: { url: 'https://voterservices.elections.maryland.gov/OnlineVoterRegistration/InstructionsStep1', available: true },
      mail: {
        available: true,
        instructions:
          'Download and complete the Maryland Voter Registration Form. Mail to your local board of elections. Must be postmarked 21 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Same-day registration is available at early voting centers during early voting and at polling places on Election Day. Bring proof of identity and Maryland residency.',
      },
    },
    officialUrl: 'https://elections.maryland.gov/voter_registration/index.html',
    checkRegistrationUrl: 'https://voterservices.elections.maryland.gov/VoterSearch',
    idRequired:
      'Maryland driver license or MVA ID number, or last four digits of SSN. For same-day registration, bring a document showing Maryland name and address.',
  },

  MA: {
    stateCode: 'MA',
    stateName: 'Massachusetts',
    deadline: {
      online: '10 days before election',
      mail: '20 days before election',
      inPerson: '20 days before election',
    },
    methods: {
      online: { url: 'https://www.sec.state.ma.us/ovr', available: true },
      mail: {
        available: true,
        instructions:
          'Complete the Massachusetts Voter Registration Application and mail to your city or town clerk. Must be received 20 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your city or town clerk\'s office. Bring a valid Massachusetts driver license or ID. Deadline is 20 days before election.',
      },
    },
    officialUrl: 'https://www.sec.state.ma.us/ele/eleifv/howreg.htm',
    checkRegistrationUrl: 'https://www.sec.state.ma.us/voterregistrationsearch/myvoterregstatus.aspx',
    idRequired:
      'Massachusetts driver license or state ID number, or last four digits of SSN. First-time voters who registered by mail may need to show ID.',
  },

  MI: {
    stateCode: 'MI',
    stateName: 'Michigan',
    deadline: {
      online: '15 days before election',
      mail: '15 days before election',
      inPerson: 'Election Day (same-day registration available)',
    },
    methods: {
      online: { url: 'https://mvic.sos.state.mi.us/RegisterVoter', available: true },
      mail: {
        available: true,
        instructions:
          'Complete the Michigan Voter Registration Application and mail to your local clerk. Must be postmarked 15 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Same-day registration is available at your local clerk\'s office from 15 days before the election through Election Day. Bring proof of Michigan residency (e.g., driver license or state ID with current address).',
      },
    },
    officialUrl: 'https://mvic.sos.state.mi.us',
    checkRegistrationUrl: 'https://mvic.sos.state.mi.us/Voter/Index',
    idRequired:
      'Michigan driver license or state ID number, or last four digits of SSN. Photo ID required at the polls or sign an affidavit.',
  },

  MN: {
    stateCode: 'MN',
    stateName: 'Minnesota',
    deadline: {
      online: '21 days before election',
      mail: '21 days before election',
      inPerson: 'Election Day (same-day registration available)',
    },
    methods: {
      online: { url: 'https://mnvotes.sos.state.mn.us/VoterRegistration/VoterRegistrationMain.aspx', available: true },
      mail: {
        available: true,
        instructions:
          'Complete the Minnesota Voter Registration Application and mail to your county auditor or city clerk. Must be received 21 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Same-day registration is available at any polling place on Election Day. Bring proof of residence (e.g., MN driver license or ID with current address, or a utility bill plus a registered voter who can vouch for you).',
      },
    },
    officialUrl: 'https://www.sos.state.mn.us/elections-voting/register-to-vote',
    checkRegistrationUrl: 'https://mnvotes.sos.state.mn.us/VoterStatus.aspx',
    idRequired:
      'Minnesota driver license or state ID number, or last four digits of SSN. For Election Day registration, present a qualifying document showing MN name and address.',
  },

  MS: {
    stateCode: 'MS',
    stateName: 'Mississippi',
    deadline: {
      online: 'Online registration not available',
      mail: '30 days before election',
      inPerson: '30 days before election',
    },
    methods: {
      mail: {
        available: true,
        instructions:
          'Download the Mississippi Voter Registration Application from the Secretary of State\'s website. Mail to your county circuit clerk. Must be postmarked 30 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county circuit clerk\'s office. Bring a valid Mississippi driver license or state ID. Deadline is 30 days before election.',
      },
    },
    officialUrl: 'https://www.sos.ms.gov/elections-voting/voter-registration',
    checkRegistrationUrl: 'https://www.sos.ms.gov/elections-voting/voter-registration/voter-registration-lookup',
    idRequired:
      'Mississippi driver license or state ID number, or last four digits of SSN. Photo ID required at the polls.',
  },

  MO: {
    stateCode: 'MO',
    stateName: 'Missouri',
    deadline: {
      online: '28 days before election',
      mail: '28 days before election',
      inPerson: '28 days before election',
    },
    methods: {
      online: { url: 'https://www.sos.mo.gov/elections/goVoteMissouri/register.aspx', available: true },
      mail: {
        available: true,
        instructions:
          'Complete the Missouri Voter Registration Application and mail to your county clerk or local election authority. Must be postmarked 28 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county clerk\'s or local election authority\'s office. Bring a valid Missouri driver license or ID. Deadline is 28 days before election.',
      },
    },
    officialUrl: 'https://www.sos.mo.gov/elections/goVoteMissouri/register.aspx',
    checkRegistrationUrl: 'https://voteroutreach.sos.mo.gov/VRprd/PublicPages/VoterSearch.aspx',
    idRequired:
      'Missouri driver license or state ID number, or last four digits of SSN. Photo ID required at the polls.',
  },

  MT: {
    stateCode: 'MT',
    stateName: 'Montana',
    deadline: {
      online: 'Online registration not available',
      mail: '30 days before election',
      inPerson: 'Election Day (same-day registration available)',
    },
    methods: {
      mail: {
        available: true,
        instructions:
          'Download the Montana Voter Registration Form and mail to your county election administrator. Must be received 30 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Late registration is available at your county election office up to noon the day before the election. Election Day registration is available at your polling place. Bring proof of Montana residency and identity.',
      },
    },
    officialUrl: 'https://sosmt.gov/elections/voter',
    checkRegistrationUrl: 'https://app.mt.gov/voterinfo',
    idRequired:
      'Montana driver license or state ID, or last four digits of SSN. For Election Day registration, bring two documents proving Montana residency, or one document with current address.',
  },

  NE: {
    stateCode: 'NE',
    stateName: 'Nebraska',
    deadline: {
      online: '18 days before election',
      mail: '18 days before election',
      inPerson: '11 days before election',
    },
    methods: {
      online: { url: 'https://www.nebraska.gov/apps-sos-voter-registration', available: true },
      mail: {
        available: true,
        instructions:
          'Complete the Nebraska Voter Registration Form and mail to your county election commissioner or clerk. Must be postmarked 18 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county election commissioner or clerk\'s office. In-person deadline is 11 days before the election. Bring a valid Nebraska driver license or ID.',
      },
    },
    officialUrl: 'https://www.sos.ne.gov/dyindex.html',
    checkRegistrationUrl: 'https://www.votercheck.necvr.ne.gov/VoterView',
    idRequired:
      'Nebraska driver license or state ID number, or last four digits of SSN. Photo ID required at the polls.',
  },

  NV: {
    stateCode: 'NV',
    stateName: 'Nevada',
    deadline: {
      online: '28 days before election',
      mail: '28 days before election',
      inPerson: 'Election Day (same-day registration available)',
    },
    methods: {
      online: { url: 'https://www.nvsos.gov/sosvoterservices/Registration/step1.aspx', available: true },
      mail: {
        available: true,
        instructions:
          'Complete the Nevada Voter Registration Form and mail to your county clerk. Must be postmarked 28 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Same-day registration is available at any polling location on Election Day. Bring proof of Nevada residency and identity (e.g., Nevada driver license or state ID with current address).',
      },
    },
    officialUrl: 'https://www.nvsos.gov/sos/elections/voters/registering-to-vote',
    checkRegistrationUrl: 'https://www.nvsos.gov/sosvoterservices/Registration/step1.aspx',
    idRequired:
      'Nevada driver license or state ID number, or last four digits of SSN. For same-day registration, bring one document with Nevada name and address.',
  },

  NH: {
    stateCode: 'NH',
    stateName: 'New Hampshire',
    deadline: {
      online: 'Online registration not available',
      mail: '30 days before election',
      inPerson: 'Election Day (same-day registration available)',
    },
    methods: {
      mail: {
        available: true,
        instructions:
          'Download and complete the New Hampshire Voter Registration Form. Mail to your town or city clerk. Must be received 30 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Election Day registration is available at your polling place. Bring proof of identity and New Hampshire domicile (e.g., NH driver license, utility bill, or lease agreement showing current address). A domicile affidavit may be required.',
      },
    },
    officialUrl: 'https://www.sos.nh.gov/elections/voters/register-vote',
    checkRegistrationUrl: 'https://app.sos.nh.gov/Public/ConfirmVoter.aspx',
    idRequired:
      'NH driver license or non-driver ID showing current address, or other documents proving identity and domicile. No statewide online registration — register in person at town/city clerk or on Election Day.',
  },

  NJ: {
    stateCode: 'NJ',
    stateName: 'New Jersey',
    deadline: {
      online: '21 days before election',
      mail: '21 days before election',
      inPerson: '21 days before election',
    },
    methods: {
      online: { url: 'https://voter.svrs.nj.gov/register', available: true },
      mail: {
        available: true,
        instructions:
          'Complete the New Jersey Voter Registration Form and mail to your county commissioner of registration. Must be received 21 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county commissioner of registration or Board of Elections. Bring a valid New Jersey driver license or state ID. Deadline is 21 days before election.',
      },
    },
    officialUrl: 'https://www.state.nj.us/state/elections/voter-registration.shtml',
    checkRegistrationUrl: 'https://voter.svrs.nj.gov/registration-check',
    idRequired:
      'New Jersey driver license or state ID number, or last four digits of SSN. First-time voters who registered by mail may need to show ID.',
  },

  NM: {
    stateCode: 'NM',
    stateName: 'New Mexico',
    deadline: {
      online: '28 days before election',
      mail: '28 days before election',
      inPerson: '28 days before election',
    },
    methods: {
      online: { url: 'https://portal.sos.state.nm.us/OVR/WebPages/InstructionsStep1.aspx', available: true },
      mail: {
        available: true,
        instructions:
          'Download and complete the New Mexico Voter Registration Form. Mail to your county clerk. Must be postmarked 28 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county clerk\'s office. Bring a valid New Mexico driver license or state ID. Deadline is 28 days before election.',
      },
    },
    officialUrl: 'https://www.sos.state.nm.us/voting-and-elections/voter-information-portal/voter-registration-information',
    checkRegistrationUrl: 'https://voterview.state.nm.us',
    idRequired:
      'New Mexico driver license or state ID number, or last four digits of SSN. First-time voters who registered by mail may need to show ID.',
  },

  NY: {
    stateCode: 'NY',
    stateName: 'New York',
    deadline: {
      online: '25 days before election',
      mail: '25 days before election',
      inPerson: '25 days before election',
    },
    methods: {
      online: { url: 'https://www.elections.ny.gov/VoterRegistration.html', available: true },
      mail: {
        available: true,
        instructions:
          'Complete the New York State Voter Registration Form and mail to your county board of elections. Must be postmarked 25 days before the election and received 20 days before.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county board of elections. Bring a valid New York driver license or non-driver ID. Deadline is 25 days before election.',
      },
    },
    officialUrl: 'https://www.elections.ny.gov/VoterRegistration.html',
    checkRegistrationUrl: 'https://voterlookup.elections.ny.gov',
    idRequired:
      'New York driver license or non-driver ID number, or last four digits of SSN. First-time voters who registered by mail may need to show ID.',
  },

  NC: {
    stateCode: 'NC',
    stateName: 'North Carolina',
    deadline: {
      online: '25 days before election',
      mail: '25 days before election',
      inPerson: '25 days before election',
    },
    methods: {
      online: { url: 'https://www.ncsbe.gov/registering/how-register/online-voter-registration', available: true },
      mail: {
        available: true,
        instructions:
          'Download the North Carolina Voter Registration Application and mail to your county board of elections. Must be postmarked 25 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county board of elections. Same-day registration is available during the early voting period. Bring proof of residency and identity. Standard deadline is 25 days before the election.',
      },
    },
    officialUrl: 'https://www.ncsbe.gov/registering',
    checkRegistrationUrl: 'https://vt.ncsbe.gov/RegLkup',
    idRequired:
      'North Carolina driver license or state ID number, or last four digits of SSN. Photo ID required at the polls.',
  },

  ND: {
    stateCode: 'ND',
    stateName: 'North Dakota',
    deadline: {
      online: 'Online registration not available',
      mail: 'North Dakota does not require voter registration',
      inPerson: 'North Dakota does not require voter registration',
    },
    methods: {
      mail: {
        available: true,
        instructions:
          'North Dakota does not have voter registration. Simply bring qualifying ID to your polling place on Election Day to vote.',
      },
      inPerson: {
        available: true,
        instructions:
          'No registration required. Bring a valid North Dakota driver license, non-driver ID, or tribal ID showing your current residential address to the polls.',
      },
    },
    officialUrl: 'https://vip.sos.nd.gov',
    idRequired:
      'North Dakota driver license, non-driver ID, or tribal government ID with current residential address. No voter registration required.',
  },

  OH: {
    stateCode: 'OH',
    stateName: 'Ohio',
    deadline: {
      online: '30 days before election',
      mail: '30 days before election',
      inPerson: '30 days before election',
    },
    methods: {
      online: { url: 'https://www.ohiosos.gov/elections/voters/register', available: true },
      mail: {
        available: true,
        instructions:
          'Download and complete the Ohio Voter Registration Form. Mail to your county board of elections. Must be postmarked 30 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county board of elections. Bring a valid Ohio driver license or state ID. Deadline is 30 days before election.',
      },
    },
    officialUrl: 'https://www.ohiosos.gov/elections/voters/register',
    checkRegistrationUrl: 'https://voterlookup.ohiosos.gov/voterlookup.aspx',
    idRequired:
      'Ohio driver license or state ID number, or last four digits of SSN. Photo ID required at the polls.',
  },

  OK: {
    stateCode: 'OK',
    stateName: 'Oklahoma',
    deadline: {
      online: '25 days before election',
      mail: '25 days before election',
      inPerson: '25 days before election',
    },
    methods: {
      online: { url: 'https://www.ok.gov/elections/Voter_Information/Register_to_Vote/index.html', available: true },
      mail: {
        available: true,
        instructions:
          'Complete the Oklahoma Voter Registration Application and mail to your county election board. Must be postmarked 25 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county election board. Bring a valid Oklahoma driver license or state ID. Deadline is 25 days before election.',
      },
    },
    officialUrl: 'https://www.ok.gov/elections/Voter_Information/Register_to_Vote/index.html',
    checkRegistrationUrl: 'https://www.ok.gov/elections/Voter_Information/Voter_Lookup/index.html',
    idRequired:
      'Oklahoma driver license or state ID number, or last four digits of SSN. Photo ID required at the polls.',
  },

  OR: {
    stateCode: 'OR',
    stateName: 'Oregon',
    deadline: {
      online: '21 days before election',
      mail: '21 days before election',
      inPerson: '21 days before election',
    },
    methods: {
      online: { url: 'https://sos.oregon.gov/voting/pages/registration.aspx', available: true },
      mail: {
        available: true,
        instructions:
          'Oregon automatically registers eligible citizens through DMV transactions. You can also mail a voter registration card to your county clerk. Must be received 21 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county clerk\'s office. Deadline is 21 days before the election. Oregon is a vote-by-mail state — all registered voters receive a ballot.',
      },
    },
    officialUrl: 'https://sos.oregon.gov/voting/pages/registration.aspx',
    checkRegistrationUrl: 'https://sos.oregon.gov/voting/pages/myvote.aspx',
    idRequired:
      'Oregon driver license or state ID number, or last four digits of SSN. Oregon automatically registers eligible voters through DMV.',
  },

  PA: {
    stateCode: 'PA',
    stateName: 'Pennsylvania',
    deadline: {
      online: '15 days before election',
      mail: '15 days before election',
      inPerson: '15 days before election',
    },
    methods: {
      online: { url: 'https://www.vote.pa.gov/Resources/Pages/Register-to-Vote.aspx', available: true },
      mail: {
        available: true,
        instructions:
          'Complete the Pennsylvania Voter Registration Application and mail to your county board of elections. Must be received 15 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county board of elections. Bring a valid Pennsylvania driver license or state ID, or the last four digits of your SSN. Deadline is 15 days before election.',
      },
    },
    officialUrl: 'https://www.vote.pa.gov',
    checkRegistrationUrl: 'https://www.pavoterservices.pa.gov/pages/voterregistrationstatus.aspx',
    idRequired:
      'Pennsylvania driver license or state ID number, or last four digits of SSN. First-time voters may need to show ID.',
  },

  RI: {
    stateCode: 'RI',
    stateName: 'Rhode Island',
    deadline: {
      online: '30 days before election',
      mail: '30 days before election',
      inPerson: '30 days before election',
    },
    methods: {
      online: { url: 'https://vote.sos.ri.gov', available: true },
      mail: {
        available: true,
        instructions:
          'Download and complete the Rhode Island Voter Registration Form. Mail to your local board of canvassers or the State Board of Elections. Must be postmarked 30 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your local board of canvassers. Bring a valid Rhode Island driver license or state ID. Deadline is 30 days before election.',
      },
    },
    officialUrl: 'https://vote.sos.ri.gov',
    checkRegistrationUrl: 'https://vote.sos.ri.gov/Voter/VoterSearch',
    idRequired:
      'Rhode Island driver license or state ID number, or last four digits of SSN. Photo ID required at the polls.',
  },

  SC: {
    stateCode: 'SC',
    stateName: 'South Carolina',
    deadline: {
      online: '30 days before election',
      mail: '30 days before election',
      inPerson: '30 days before election',
    },
    methods: {
      online: { url: 'https://info.scvotes.sc.gov/eng/ovr/start.aspx', available: true },
      mail: {
        available: true,
        instructions:
          'Download and complete the South Carolina Voter Registration Application. Mail to your county voter registration and elections office. Must be postmarked 30 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county voter registration and elections office. Bring a valid South Carolina driver license or state ID. Deadline is 30 days before election.',
      },
    },
    officialUrl: 'https://www.scvotes.gov',
    checkRegistrationUrl: 'https://info.scvotes.sc.gov/eng/vhsearch/VoterSearch.aspx',
    idRequired:
      'South Carolina driver license or state ID number, or last four digits of SSN. Photo ID required at the polls.',
  },

  SD: {
    stateCode: 'SD',
    stateName: 'South Dakota',
    deadline: {
      online: '15 days before election',
      mail: '15 days before election',
      inPerson: '15 days before election',
    },
    methods: {
      online: { url: 'https://vip.sdsos.gov/VIPLogin.aspx', available: true },
      mail: {
        available: true,
        instructions:
          'Download the South Dakota Voter Registration Form and mail to your county auditor. Must be received 15 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county auditor\'s office. Bring a valid South Dakota driver license or state ID. Deadline is 15 days before election.',
      },
    },
    officialUrl: 'https://sdsos.gov/elections-voting/voting/register-to-vote/default.aspx',
    checkRegistrationUrl: 'https://vip.sdsos.gov/VIPLogin.aspx',
    idRequired:
      'South Dakota driver license or state ID number, or last four digits of SSN. Photo ID required at the polls.',
  },

  TN: {
    stateCode: 'TN',
    stateName: 'Tennessee',
    deadline: {
      online: '30 days before election',
      mail: '30 days before election',
      inPerson: '30 days before election',
    },
    methods: {
      online: { url: 'https://ovr.govote.tn.gov', available: true },
      mail: {
        available: true,
        instructions:
          'Download and complete the Tennessee Voter Registration Application. Mail to your county election commission. Must be postmarked 30 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county election commission office. Bring a valid Tennessee driver license or photo ID. Deadline is 30 days before election.',
      },
    },
    officialUrl: 'https://sos.tn.gov/elections/voters',
    checkRegistrationUrl: 'https://ovr.govote.tn.gov',
    idRequired:
      'Tennessee driver license or state photo ID number, or last four digits of SSN. Photo ID required at the polls.',
  },

  TX: {
    stateCode: 'TX',
    stateName: 'Texas',
    deadline: {
      online: 'Online registration not available',
      mail: '30 days before election',
      inPerson: '30 days before election',
    },
    methods: {
      mail: {
        available: true,
        instructions:
          'Complete the Texas Voter Registration Application (available at county tax offices, libraries, and post offices) and mail to your county voter registrar. Must be received 30 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county tax assessor-collector\'s office (which handles voter registration). Bring a valid Texas driver license or state ID. Deadline is 30 days before election.',
      },
    },
    officialUrl: 'https://www.votetexas.gov/register-to-vote',
    checkRegistrationUrl: 'https://teamrv-mvp.sos.texas.gov/MVP/mvp.do',
    idRequired:
      'Texas driver license or personal ID card number, or last four digits of SSN. Photo ID required at the polls (Texas DL, passport, military ID, or Texas Election ID Certificate).',
  },

  UT: {
    stateCode: 'UT',
    stateName: 'Utah',
    deadline: {
      online: '11 days before election',
      mail: '30 days before election',
      inPerson: '7 days before election',
    },
    methods: {
      online: { url: 'https://vote.utah.gov/vote/menu/index', available: true },
      mail: {
        available: true,
        instructions:
          'Download and complete the Utah Voter Registration Form. Mail to your county clerk. Must be postmarked 30 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county clerk\'s office. In-person registration is available up to 7 days before the election. Utah is a vote-by-mail state — registered voters receive a mail ballot.',
      },
    },
    officialUrl: 'https://vote.utah.gov',
    checkRegistrationUrl: 'https://votesearch.utah.gov/voter-search/search/search-by-voter/voter-info',
    idRequired:
      'Utah driver license or state ID number, or last four digits of SSN. Utah is a vote-by-mail state.',
  },

  VT: {
    stateCode: 'VT',
    stateName: 'Vermont',
    deadline: {
      online: 'Election Day (same-day registration available)',
      mail: 'Election Day (same-day registration available)',
      inPerson: 'Election Day (same-day registration available)',
    },
    methods: {
      online: { url: 'https://olvr.vermont.gov', available: true },
      mail: {
        available: true,
        instructions:
          'Vermont automatically registers eligible citizens through DMV transactions. You may also mail a voter registration form to your town clerk. Vermont offers same-day registration through Election Day.',
      },
      inPerson: {
        available: true,
        instructions:
          'Same-day registration is available at your town clerk\'s office or polling place on Election Day. Vermont is a vote-by-mail state — all voters are automatically sent a mail ballot.',
      },
    },
    officialUrl: 'https://sos.vermont.gov/elections/voters/registration',
    checkRegistrationUrl: 'https://mvp.vermont.gov',
    idRequired:
      'Vermont does not require ID to vote if you are already on the checklist. For same-day registration, provide proof of Vermont residency and identity.',
  },

  VA: {
    stateCode: 'VA',
    stateName: 'Virginia',
    deadline: {
      online: '22 days before election',
      mail: '22 days before election',
      inPerson: '22 days before election',
    },
    methods: {
      online: { url: 'https://www.vote.virginia.gov', available: true },
      mail: {
        available: true,
        instructions:
          'Download the Virginia Voter Registration Application and mail to your local general registrar. Must be postmarked 22 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your local general registrar\'s office. Bring a valid Virginia driver license or state ID. Deadline is 22 days before election.',
      },
    },
    officialUrl: 'https://www.elections.virginia.gov/registration/how-to-register',
    checkRegistrationUrl: 'https://www.elections.virginia.gov/citizen-portal',
    idRequired:
      'Virginia driver license or DMV-issued ID number, or last four digits of SSN. Acceptable photo ID required at the polls.',
  },

  WA: {
    stateCode: 'WA',
    stateName: 'Washington',
    deadline: {
      online: '8 days before election',
      mail: '29 days before election',
      inPerson: 'Election Day (same-day registration available)',
    },
    methods: {
      online: { url: 'https://voter.votewa.gov/WhereToVote.aspx', available: true },
      mail: {
        available: true,
        instructions:
          'Complete the Washington Voter Registration Form and mail to your county auditor. Must be postmarked 29 days before the election. Washington is a vote-by-mail state.',
      },
      inPerson: {
        available: true,
        instructions:
          'Same-day registration is available at your county elections office through Election Day. Bring proof of Washington residency (e.g., WA driver license or state ID with current address).',
      },
    },
    officialUrl: 'https://www.sos.wa.gov/elections/voters',
    checkRegistrationUrl: 'https://voter.votewa.gov/WhereToVote.aspx',
    idRequired:
      'Washington driver license or state ID number, or last four digits of SSN. Washington is a vote-by-mail state.',
  },

  WV: {
    stateCode: 'WV',
    stateName: 'West Virginia',
    deadline: {
      online: '21 days before election',
      mail: '21 days before election',
      inPerson: '21 days before election',
    },
    methods: {
      online: { url: 'https://ovr.sos.wv.gov/Register/Landing', available: true },
      mail: {
        available: true,
        instructions:
          'Download and complete the West Virginia Voter Registration Application. Mail to your county clerk. Must be received 21 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Visit your county clerk\'s office. Bring a valid West Virginia driver license or state ID. Deadline is 21 days before election.',
      },
    },
    officialUrl: 'https://sos.wv.gov/elections/Pages/VoterRegistrationInfo.aspx',
    checkRegistrationUrl: 'https://apps.sos.wv.gov/elections/voter/find-voter-registration.aspx',
    idRequired:
      'West Virginia driver license or state ID number, or last four digits of SSN. Photo ID required at the polls.',
  },

  WI: {
    stateCode: 'WI',
    stateName: 'Wisconsin',
    deadline: {
      online: '20 days before election',
      mail: '20 days before election',
      inPerson: 'Election Day (same-day registration available)',
    },
    methods: {
      online: { url: 'https://myvote.wi.gov/en-us/RegisterToVote', available: true },
      mail: {
        available: true,
        instructions:
          'Download and complete the Wisconsin Voter Registration Application (EL-131). Mail to your municipal clerk. Must be received 20 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Election Day registration is available at your polling place. Bring proof of residence (e.g., Wisconsin driver license or state ID, or a utility bill showing your current address).',
      },
    },
    officialUrl: 'https://myvote.wi.gov/en-us/RegisterToVote',
    checkRegistrationUrl: 'https://myvote.wi.gov/en-us/VoterRegistration',
    idRequired:
      'Wisconsin driver license or state ID number, or last four digits of SSN. For Election Day registration, bring one qualifying proof-of-residence document. Photo ID required at the polls.',
  },

  WY: {
    stateCode: 'WY',
    stateName: 'Wyoming',
    deadline: {
      online: 'Online registration not available',
      mail: '14 days before election',
      inPerson: 'Election Day (same-day registration available)',
    },
    methods: {
      mail: {
        available: true,
        instructions:
          'Download and complete the Wyoming Voter Registration Form. Mail to your county clerk. Must be received 14 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Election Day registration is available at your polling place or county clerk\'s office. Bring proof of Wyoming residency and identity (e.g., Wyoming driver license or state ID with current address, or another document showing Wyoming residence).',
      },
    },
    officialUrl: 'https://sos.wyo.gov/Elections/Docs/WYVoterReg.pdf',
    checkRegistrationUrl: 'https://sos.wyo.gov/Elections/VoterRegStatus.aspx',
    idRequired:
      'Wyoming driver license or state ID, or last four digits of SSN. For Election Day registration, bring a document proving Wyoming residency.',
  },

  DC: {
    stateCode: 'DC',
    stateName: 'District of Columbia',
    deadline: {
      online: '21 days before election',
      mail: '21 days before election',
      inPerson: 'Election Day (same-day registration available)',
    },
    methods: {
      online: { url: 'https://www.vote4dc.com/ApplyInstructions/SVR', available: true },
      mail: {
        available: true,
        instructions:
          'Download and complete the DC Voter Registration Application. Mail to the DC Board of Elections. Must be postmarked 21 days before the election.',
      },
      inPerson: {
        available: true,
        instructions:
          'Same-day registration is available at any vote center during early voting and on Election Day. Bring proof of DC residency and identity (e.g., DC driver license or government-issued photo ID with DC address).',
      },
    },
    officialUrl: 'https://www.dcboe.org/Voters/Register-To-Vote/Register-Update-Voter-Registration',
    checkRegistrationUrl: 'https://www.vote4dc.com/SearchAction',
    idRequired:
      'DC driver license or DC non-driver ID, or last four digits of SSN. For same-day registration, bring a document showing DC name and address.',
  },
};
