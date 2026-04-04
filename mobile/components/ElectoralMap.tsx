import { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Svg, { Path, G } from 'react-native-svg'
import { geoAlbersUsa, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'

// Bundled locally — no CDN required, works in Expo Go
// eslint-disable-next-line @typescript-eslint/no-var-requires
const US_TOPO = require('../assets/states-10m.json')

// FIPS → state abbreviation
const FIPS: Record<string, string> = {
  '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE',
  '12':'FL','13':'GA','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS',
  '21':'KY','22':'LA','23':'ME','24':'MD','25':'MA','26':'MI','27':'MN','28':'MS',
  '29':'MO','30':'MT','31':'NE','32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY',
  '37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC',
  '46':'SD','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV',
  '55':'WI','56':'WY',
}

// 2026 competitiveness colors
const STATE_COLORS: Record<string, string> = {
  AL:'#7f1d1d',AK:'#7f1d1d',AR:'#7f1d1d',ID:'#7f1d1d',IN:'#7f1d1d',KS:'#7f1d1d',
  KY:'#7f1d1d',LA:'#7f1d1d',MO:'#7f1d1d',MS:'#7f1d1d',MT:'#7f1d1d',ND:'#7f1d1d',
  NE:'#7f1d1d',OK:'#7f1d1d',SC:'#7f1d1d',SD:'#7f1d1d',TN:'#7f1d1d',TX:'#7f1d1d',
  UT:'#7f1d1d',WV:'#7f1d1d',WY:'#7f1d1d',
  AZ:'#ef4444',FL:'#ef4444',GA:'#ef4444',IA:'#ef4444',NC:'#ef4444',OH:'#ef4444',
  MI:'#7c3aed',NV:'#7c3aed',NH:'#7c3aed',PA:'#7c3aed',WI:'#7c3aed',
  CO:'#3b82f6',ME:'#3b82f6',MN:'#3b82f6',NM:'#3b82f6',OR:'#3b82f6',VA:'#3b82f6',
  CA:'#1e3a8a',CT:'#1e3a8a',DE:'#1e3a8a',HI:'#1e3a8a',IL:'#1e3a8a',MA:'#1e3a8a',
  MD:'#1e3a8a',NJ:'#1e3a8a',NY:'#1e3a8a',RI:'#1e3a8a',VT:'#1e3a8a',WA:'#1e3a8a',
}

const VIEWPORT_W = 960
const VIEWPORT_H = 600

interface ElectoralMapProps {
  selectedState: string | null
  onSelectState: (code: string | null) => void
}

export function ElectoralMap({ selectedState, onSelectState }: ElectoralMapProps) {
  const [viewW, setViewW] = useState(375)
  const viewH = Math.round(viewW * (VIEWPORT_H / VIEWPORT_W))

  // Pre-compute all SVG paths at 960×600 (memoized — only runs once)
  const statePaths = useMemo(() => {
    const projection = geoAlbersUsa()
      .scale(1280)
      .translate([VIEWPORT_W / 2, VIEWPORT_H / 2])

    const pathGen = geoPath(projection)

    // TopoJSON → GeoJSON
    const geojson = feature(US_TOPO, US_TOPO.objects.states) as unknown as GeoJSON.FeatureCollection

    return geojson.features.map(f => {
      const fipsCode = String(f.id).padStart(2, '0')
      const code = FIPS[fipsCode] ?? ''
      const d = pathGen(f) ?? ''
      return { code, d, fipsCode }
    }).filter(s => s.d && s.code)
  }, [])

  return (
    <View
      style={styles.wrapper}
      onLayout={e => setViewW(e.nativeEvent.layout.width)}
    >
      <Svg
        width={viewW}
        height={viewH}
        viewBox={`0 0 ${VIEWPORT_W} ${VIEWPORT_H}`}
        style={styles.svg}
      >
        <G>
          {statePaths.map(({ code, d }) => {
            const isSelected = selectedState === code
            const fill = isSelected ? '#f59e0b' : (STATE_COLORS[code] ?? '#334155')
            return (
              <Path
                key={code}
                d={d}
                fill={fill}
                stroke="#0f172a"
                strokeWidth={isSelected ? 2.5 : 0.7}
                onPress={() => onSelectState(isSelected ? null : code)}
              />
            )
          })}
        </G>
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        {LEGEND.map(item => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {selectedState && (
        <TouchableOpacity style={styles.clearBtn} onPress={() => onSelectState(null)}>
          <Text style={styles.clearText}>✕ {selectedState}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const LEGEND = [
  { color: '#7f1d1d', label: 'Safe R' },
  { color: '#ef4444', label: 'Lean R' },
  { color: '#7c3aed', label: 'Toss-Up' },
  { color: '#3b82f6', label: 'Lean D' },
  { color: '#1e3a8a', label: 'Safe D' },
]

const styles = StyleSheet.create({
  wrapper: { backgroundColor: '#0f172a', marginBottom: 4 },
  svg: { backgroundColor: '#0f172a' },
  legend: {
    flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap',
    gap: 8, paddingVertical: 6, paddingHorizontal: 8, backgroundColor: '#0f172a',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 9, height: 9, borderRadius: 2 },
  legendLabel: { fontSize: 9, color: '#94a3b8', fontWeight: '700' },
  clearBtn: {
    alignSelf: 'center', marginBottom: 6, backgroundColor: '#f59e0b',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4,
  },
  clearText: { fontSize: 12, fontWeight: '700', color: '#000' },
})
