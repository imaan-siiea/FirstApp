import { useRef, useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'

interface ElectoralMapProps {
  selectedState: string | null
  onSelectState: (code: string | null) => void
}

// FIPS code → state abbreviation (us-atlas TopoJSON uses FIPS numeric IDs)
const FIPS_TO_CODE: Record<string, string> = {
  '1':'AL','2':'AK','4':'AZ','5':'AR','6':'CA','8':'CO','9':'CT','10':'DE','12':'FL','13':'GA',
  '15':'HI','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME',
  '24':'MD','25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE','32':'NV',
  '33':'NH','34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND','39':'OH','40':'OK','41':'OR',
  '42':'PA','44':'RI','45':'SC','46':'SD','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA',
  '53':'WA','54':'WV','55':'WI','56':'WY',
}

const FIPS_TO_NAME: Record<string, string> = {
  '1':'Alabama','2':'Alaska','4':'Arizona','5':'Arkansas','6':'California','8':'Colorado',
  '9':'Connecticut','10':'Delaware','12':'Florida','13':'Georgia','15':'Hawaii','16':'Idaho',
  '17':'Illinois','18':'Indiana','19':'Iowa','20':'Kansas','21':'Kentucky','22':'Louisiana',
  '23':'Maine','24':'Maryland','25':'Massachusetts','26':'Michigan','27':'Minnesota',
  '28':'Mississippi','29':'Missouri','30':'Montana','31':'Nebraska','32':'Nevada',
  '33':'New Hampshire','34':'New Jersey','35':'New Mexico','36':'New York',
  '37':'North Carolina','38':'North Dakota','39':'Ohio','40':'Oklahoma','41':'Oregon',
  '42':'Pennsylvania','44':'Rhode Island','45':'South Carolina','46':'South Dakota',
  '47':'Tennessee','48':'Texas','49':'Utah','50':'Vermont','51':'Virginia',
  '53':'Washington','54':'West Virginia','55':'Wisconsin','56':'Wyoming',
}

// 2026 competitiveness colors (based on 2024 results + early race ratings)
const STATE_COLORS: Record<string, string> = {
  // Safe Republican
  AL:'#991b1b',AK:'#991b1b',AR:'#991b1b',ID:'#991b1b',IN:'#991b1b',KS:'#991b1b',
  KY:'#991b1b',LA:'#991b1b',MO:'#991b1b',MS:'#991b1b',MT:'#991b1b',ND:'#991b1b',
  NE:'#991b1b',OK:'#991b1b',SC:'#991b1b',SD:'#991b1b',TN:'#991b1b',TX:'#991b1b',
  UT:'#991b1b',WV:'#991b1b',WY:'#991b1b',
  // Lean/Likely Republican
  AZ:'#ef4444',FL:'#ef4444',GA:'#ef4444',IA:'#ef4444',NC:'#ef4444',OH:'#ef4444',
  // Toss-Up
  MI:'#7c3aed',NV:'#7c3aed',NH:'#7c3aed',PA:'#7c3aed',WI:'#7c3aed',
  // Lean/Likely Democratic
  CO:'#3b82f6',ME:'#3b82f6',MN:'#3b82f6',NM:'#3b82f6',OR:'#3b82f6',VA:'#3b82f6',
  // Safe Democratic
  CA:'#1d4ed8',CT:'#1d4ed8',DE:'#1d4ed8',HI:'#1d4ed8',IL:'#1d4ed8',MA:'#1d4ed8',
  MD:'#1d4ed8',NJ:'#1d4ed8',NY:'#1d4ed8',RI:'#1d4ed8',VT:'#1d4ed8',WA:'#1d4ed8',
}

const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #0f172a; }
  #map { width: 100%; height: 100%; }
  svg { display: block; }
  .state { cursor: pointer; stroke: #0f172a; stroke-width: 0.7; transition: filter 0.15s; }
  .state.selected { stroke: #f8fafc; stroke-width: 2.5; filter: brightness(1.25); }
  .legend {
    position: fixed; bottom: 6px; left: 0; right: 0;
    display: flex; justify-content: center; gap: 8px; padding: 0 8px; flex-wrap: wrap;
  }
  .li { display: flex; align-items: center; gap: 3px; }
  .ld { width: 9px; height: 9px; border-radius: 2px; }
  .ll { font-size: 9px; color: #94a3b8; font-weight: 700; font-family: -apple-system, sans-serif; }
  .badge {
    position: fixed; top: 8px; left: 50%; transform: translateX(-50%);
    background: rgba(15,23,42,0.92); color: #f8fafc; border: 1px solid #334155;
    padding: 4px 14px; border-radius: 20px;
    font-size: 12px; font-weight: 700; font-family: -apple-system, sans-serif;
    display: none; white-space: nowrap; pointer-events: none;
  }
</style>
</head>
<body>
<div id="map"></div>
<div class="legend">
  <div class="li"><div class="ld" style="background:#991b1b"></div><span class="ll">Safe R</span></div>
  <div class="li"><div class="ld" style="background:#ef4444"></div><span class="ll">Lean R</span></div>
  <div class="li"><div class="ld" style="background:#7c3aed"></div><span class="ll">Toss-Up</span></div>
  <div class="li"><div class="ld" style="background:#3b82f6"></div><span class="ll">Lean D</span></div>
  <div class="li"><div class="ld" style="background:#1d4ed8"></div><span class="ll">Safe D</span></div>
</div>
<div class="badge" id="badge"></div>
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js"></script>
<script>
const FIPS_TO_CODE = ${JSON.stringify(FIPS_TO_CODE)};
const FIPS_TO_NAME = ${JSON.stringify(FIPS_TO_NAME)};
const STATE_COLORS = ${JSON.stringify(STATE_COLORS)};

let selectedCode = null;
const badge = document.getElementById('badge');
const mapEl = document.getElementById('map');

const w = window.innerWidth;
const h = window.innerHeight;

const svg = d3.select('#map')
  .append('svg')
  .attr('width', w)
  .attr('height', h);

const projection = d3.geoAlbersUsa().fitSize([w, h - 28], { type: 'Sphere' });
const path = d3.geoPath().projection(projection);

function setSelected(code) {
  selectedCode = code;
  svg.selectAll('.state').classed('selected', d => FIPS_TO_CODE[String(+d.id)] === code);
  if (code) {
    const fips = Object.keys(FIPS_TO_CODE).find(k => FIPS_TO_CODE[k] === code);
    badge.textContent = fips ? FIPS_TO_NAME[fips] : code;
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }
}

fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
  .then(r => r.json())
  .then(us => {
    const states = topojson.feature(us, us.objects.states);
    svg.selectAll('.state')
      .data(states.features)
      .join('path')
      .attr('class', 'state')
      .attr('d', path)
      .attr('fill', d => STATE_COLORS[FIPS_TO_CODE[String(+d.id)]] || '#334155')
      .on('click', (event, d) => {
        const code = FIPS_TO_CODE[String(+d.id)];
        if (!code) return;
        const next = selectedCode === code ? null : code;
        setSelected(next);
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'selectState', code: next }));
        }
      });
  });

window.resetSelection = function() { setSelected(null); };
window.setSelectedState = function(code) { setSelected(code); };
<\/script>
</body>
</html>`

export function ElectoralMap({ selectedState, onSelectState }: ElectoralMapProps) {
  const webViewRef = useRef<WebView>(null)

  useEffect(() => {
    if (!selectedState) {
      webViewRef.current?.injectJavaScript('window.resetSelection && window.resetSelection(); true;')
    } else {
      webViewRef.current?.injectJavaScript(
        `window.setSelectedState && window.setSelectedState(${JSON.stringify(selectedState)}); true;`
      )
    }
  }, [selectedState])

  function handleMessage(event: { nativeEvent: { data: string } }) {
    try {
      const data = JSON.parse(event.nativeEvent.data)
      if (data.type === 'selectState') onSelectState(data.code)
    } catch {}
  }

  return (
    <View style={styles.wrapper}>
      <WebView
        ref={webViewRef}
        source={{ html: MAP_HTML }}
        style={styles.map}
        onMessage={handleMessage}
        javaScriptEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 4 },
  map: { height: 220, width: '100%', backgroundColor: '#0f172a' },
})
