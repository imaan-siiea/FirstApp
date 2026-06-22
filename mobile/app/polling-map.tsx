import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Linking, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useAppStore } from '../lib/store'
import { api } from '../lib/api'
import { extractStateCode } from '../lib/extractStateCode'

// Official polling place finders by state
const POLLING_URLS: Record<string, { label: string; url: string }> = {
  AL: { label: 'Alabama My Polling Place', url: 'https://myinfo.alabamavotes.gov/VoterView' },
  AK: { label: 'Alaska Polling Place Finder', url: 'https://myvoterinformation.alaska.gov' },
  AZ: { label: 'Arizona Polling Place Finder', url: 'https://my.arizona.vote/PortalList.aspx' },
  AR: { label: 'Arkansas Vote.org', url: 'https://www.vote.org/polling-place-locator/' },
  CA: { label: 'California Polling Place', url: 'https://www.sos.ca.gov/elections/polling-place' },
  CO: { label: 'Colorado Voter Portal', url: 'https://www.sos.state.co.us/voter/pages/pub/olvr/findVoterReg.xhtml' },
  CT: { label: 'Connecticut Polling Place', url: 'https://voterregistration.ct.gov/OLVR/welcome.do' },
  DE: { label: 'Delaware Polling Place', url: 'https://ivote.de.gov/VoterView' },
  FL: { label: 'Florida Polling Place', url: 'https://registration.elections.myflorida.com/CheckVoterStatus' },
  GA: { label: 'Georgia My Voter Page', url: 'https://mvp.sos.ga.gov' },
  HI: { label: 'Hawaii Voter Info', url: 'https://olvr.hawaii.gov' },
  ID: { label: 'Idaho Polling Place', url: 'https://elections.sos.idaho.gov/ElectionLink/VoterSearch/VoterSearch.aspx' },
  IL: { label: 'Illinois My Voter Info', url: 'https://www.elections.il.gov/VotingAndRegistrationSystems/MyVoterInfo.aspx' },
  IN: { label: 'Indiana Voter Portal', url: 'https://indianavoters.in.gov' },
  IA: { label: 'Iowa Voter Info', url: 'https://sos.iowa.gov/elections/voterinformation/pollingplace.html' },
  KS: { label: 'Kansas Voter View', url: 'https://myvoteinfo.voteks.org/VoterView' },
  KY: { label: 'Kentucky Voter Info', url: 'https://vrsws.sos.ky.gov/ovrweb' },
  LA: { label: 'Louisiana Geaux Vote', url: 'https://www.geauxvote.com' },
  ME: { label: 'Maine Voter Info', url: 'https://www.maine.gov/sos/cec/elec/voter-info/index.html' },
  MD: { label: 'Maryland Voter Lookup', url: 'https://voterservices.elections.maryland.gov/VoterSearch' },
  MA: { label: 'Massachusetts Voter Reg', url: 'https://www.sec.state.ma.us/VoterRegistrationSearch/MyVoterRegStatus.aspx' },
  MI: { label: 'Michigan Voter Info', url: 'https://mvic.sos.state.mi.us' },
  MN: { label: 'Minnesota Polling Place', url: 'https://pollingplace.mn.gov' },
  MS: { label: 'Mississippi Voter Portal', url: 'https://www.sos.ms.gov/voter-registration-center/polling-place-locator' },
  MO: { label: 'Missouri Voter Info', url: 'https://voteroutreach.sos.mo.gov/VoterOutreach' },
  MT: { label: 'Montana Voter Info', url: 'https://app.mt.gov/voterinfo' },
  NE: { label: 'Nebraska Voter Check', url: 'https://www.votercheck.necvr.ne.gov/voterview' },
  NV: { label: 'Nevada MyVote', url: 'https://www.nvsos.gov/sosvoterservices/Registration/step1.aspx' },
  NH: { label: 'New Hampshire Voter Portal', url: 'https://app.sos.nh.gov/voterinformation' },
  NJ: { label: 'New Jersey Voter Info', url: 'https://voter.svrs.nj.gov/registration-check' },
  NM: { label: 'New Mexico Voter View', url: 'https://voterview.state.nm.us/VoterView' },
  NY: { label: 'New York Polling Site', url: 'https://www.elections.ny.gov/NYSBOE/lookup/pollsite.aspx' },
  NC: { label: 'NC Voter Search', url: 'https://vt.ncsbe.gov/RegLkup' },
  ND: { label: 'North Dakota Voter Portal', url: 'https://vip.sos.nd.gov' },
  OH: { label: 'Ohio Voter Info', url: 'https://www.ohiosos.gov/elections/voters' },
  OK: { label: 'Oklahoma Voter Portal', url: 'https://www.ok.gov/elections/Voter_Info' },
  OR: { label: 'Oregon My Vote', url: 'https://myvote.sos.oregon.gov' },
  PA: { label: 'Pennsylvania Voter Portal', url: 'https://www.vote.pa.gov/Voting-in-PA/Pages/Polling-Place-Search.aspx' },
  RI: { label: 'Rhode Island Voter Portal', url: 'https://vote.sos.ri.gov' },
  SC: { label: 'South Carolina My Voter', url: 'https://www.scvotes.net/scsec/MyVoterInformationPortal.do' },
  SD: { label: 'South Dakota My Voter', url: 'https://vip.sdsos.gov/VIPLogin.aspx' },
  TN: { label: 'Tennessee Voter Info', url: 'https://tnmap.tn.gov/voterlookup' },
  TX: { label: 'Texas Voter Info', url: 'https://teamrv-mvp.sos.texas.gov/MVP/mvp.do' },
  UT: { label: 'Utah Voter Info', url: 'https://votesearch.utah.gov/voter-search/search/search-by-address/voter-info' },
  VT: { label: 'Vermont My Voter Page', url: 'https://mvp.vermont.gov' },
  VA: { label: 'Virginia Voter Info', url: 'https://vote.elections.virginia.gov/VoterInformation' },
  WA: { label: 'Washington Voter Info', url: 'https://voter.votewa.gov/WhereDoIVote.aspx' },
  WV: { label: 'West Virginia Voter Info', url: 'https://ovr.sos.wv.gov/Register/Landing' },
  WI: { label: 'Wisconsin MyVote', url: 'https://myvote.wi.gov/en-US/FindMyPollingPlace' },
  WY: { label: 'Wyoming Voter Lookup', url: 'https://sos.wyo.gov/elections/voter.aspx' },
  DC: { label: 'DC Polling Place', url: 'https://www.vote4dc.com' },
}

export default function PollingMapScreen() {
  const address = useAppStore((s) => s.address)
  const insets = useSafeAreaInsets()
  const stateCode = extractStateCode(address)
  const officialLink = stateCode ? POLLING_URLS[stateCode] : null

  const { data, isLoading } = useQuery({
    queryKey: ['polling-places', address],
    queryFn: () => api.getPollingPlaces(address!),
    enabled: !!address,
  })

  const coords = data?.coords
  const region = coords
    ? { latitude: coords.lat, longitude: coords.lng, latitudeDelta: 0.04, longitudeDelta: 0.04 }
    : { latitude: 37.09, longitude: -95.71, latitudeDelta: 40, longitudeDelta: 40 }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Polling Place</Text>
        <Text style={styles.headerSubtitle} numberOfLines={1}>{address ?? 'your address'}</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1e3a5f" />
          <Text style={styles.loadingText}>Locating your address…</Text>
        </View>
      ) : (
        <>
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            region={region}
          >
            {coords && (
              <Marker
                coordinate={{ latitude: coords.lat, longitude: coords.lng }}
                title="Your Address"
                description={address ?? ''}
                pinColor="#1e3a5f"
              />
            )}
          </MapView>

          <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>📍 Your Assigned Polling Place</Text>
              <Text style={styles.infoBody}>
                Polling places are assigned by your county based on your registered address. Use your state's official tool below to find your exact polling location.
              </Text>
            </View>

            {officialLink ? (
              <TouchableOpacity
                style={styles.officialBtn}
                onPress={() => Linking.openURL(officialLink.url)}
              >
                <Text style={styles.officialBtnText}>🏛️ {officialLink.label} →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.officialBtn}
                onPress={() => Linking.openURL('https://www.vote.org/polling-place-locator/')}
              >
                <Text style={styles.officialBtnText}>🗳️ Find My Polling Place (Vote.org) →</Text>
              </TouchableOpacity>
            )}

            <View style={styles.tipsBox}>
              <Text style={styles.tipsTitle}>Election Day Tips</Text>
              <Text style={styles.tip}>• Bring a valid photo ID if your state requires it</Text>
              <Text style={styles.tip}>• Polls typically open 7am and close at 7–8pm</Text>
              <Text style={styles.tip}>• If you're in line when polls close, you can still vote</Text>
              <Text style={styles.tip}>• You must vote at your assigned polling place</Text>
            </View>
          </ScrollView>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

  header: { backgroundColor: '#1e3a5f', padding: 20, paddingBottom: 16 },
  backBtn: { marginBottom: 10 },
  backText: { color: '#93c5fd', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 2 },
  headerSubtitle: { fontSize: 13, color: '#93c5fd' },

  map: { height: 260, width: '100%' },

  panel: { flex: 1 },
  panelContent: { padding: 16, gap: 12 },

  infoBox: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderLeftWidth: 4, borderLeftColor: '#1e3a5f',
  },
  infoTitle: { fontSize: 15, fontWeight: '700', color: '#1e3a5f', marginBottom: 8 },
  infoBody: { fontSize: 13, color: '#475569', lineHeight: 19 },

  officialBtn: {
    backgroundColor: '#1e3a5f', borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  officialBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  tipsBox: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#bbf7d0' },
  tipsTitle: { fontSize: 14, fontWeight: '700', color: '#166534', marginBottom: 8 },
  tip: { fontSize: 13, color: '#15803d', lineHeight: 22 },

  loadingText: { marginTop: 12, color: '#64748b', fontSize: 14 },
})
