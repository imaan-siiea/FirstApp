import { useState, useMemo, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Svg, { Path, G } from 'react-native-svg'
import { geoAlbersUsa, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const US_TOPO = require('../assets/states-10m.json')

const FIPS: Record<string, string> = {
  '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE',
  '12':'FL','13':'GA','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS',
  '21':'KY','22':'LA','23':'ME','24':'MD','25':'MA','26':'MI','27':'MN','28':'MS',
  '29':'MO','30':'MT','31':'NE','32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY',
  '37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC',
  '46':'SD','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV',
  '55':'WI','56':'WY',
}

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

// Standard D3 AlbersUsa viewport — matches the default scale/translate
const VW = 960
const VH = 600
const PAD = 50 // padding around zoomed state

interface VB { x: number; y: number; w: number; h: number }
const FULL: VB = { x: 0, y: 0, w: VW, h: VH }

interface ElectoralMapProps {
  selectedState: string | null
  onSelectState: (code: string | null) => void
}

export function ElectoralMap({ selectedState, onSelectState }: ElectoralMapProps) {
  const [viewW, setViewW] = useState(375)
  const viewH = Math.round(viewW * (VH / VW))

  const [viewBox, setViewBox] = useState<VB>(FULL)
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentVB = useRef<VB>(FULL)

  // Pre-compute SVG paths + bounding boxes once using correct default AlbersUsa params
  const { statePaths, stateBounds } = useMemo(() => {
    // Use geoAlbersUsa() defaults: scale=1070, translate=[480,250]
    // These are the correct params for a 960×600 viewport
    const projection = geoAlbersUsa()
    const pathGen = geoPath(projection)
    const geojson = feature(US_TOPO, US_TOPO.objects.states) as unknown as GeoJSON.FeatureCollection

    const paths: { code: string; d: string }[] = []
    const bounds: Record<string, VB> = {}

    for (const f of geojson.features) {
      const fipsCode = String(f.id).padStart(2, '0')
      const code = FIPS[fipsCode]
      if (!code) continue
      const d = pathGen(f)
      if (!d) continue
      paths.push({ code, d })

      const [[x0, y0], [x1, y1]] = pathGen.bounds(f)
      const cx = (x0 + x1) / 2
      const cy = (y0 + y1) / 2
      const stateW = (x1 - x0) + PAD * 2
      const stateH = (y1 - y0) + PAD * 2
      const AR = VW / VH // 1.6 — match container so no letterboxing

      let bw: number, bh: number
      if (stateW / stateH >= AR) {
        bw = stateW
        bh = stateW / AR
      } else {
        bh = stateH
        bw = stateH * AR
      }

      bounds[code] = {
        x: cx - bw / 2,
        y: cy - bh / 2,
        w: bw,
        h: bh,
      }
    }

    return { statePaths: paths, stateBounds: bounds }
  }, [])

  // Smooth viewBox animation via lerp
  useEffect(() => {
    const target = (selectedState && stateBounds[selectedState]) ? stateBounds[selectedState] : FULL

    if (animRef.current) clearInterval(animRef.current)

    const DURATION = 350 // ms
    const start = Date.now()
    const from = { ...currentVB.current }

    animRef.current = setInterval(() => {
      const t = Math.min((Date.now() - start) / DURATION, 1)
      // Ease out cubic
      const e = 1 - Math.pow(1 - t, 3)

      const next: VB = {
        x: from.x + (target.x - from.x) * e,
        y: from.y + (target.y - from.y) * e,
        w: from.w + (target.w - from.w) * e,
        h: from.h + (target.h - from.h) * e,
      }
      currentVB.current = next
      setViewBox({ ...next })

      if (t >= 1) {
        clearInterval(animRef.current!)
        animRef.current = null
      }
    }, 16)

    return () => { if (animRef.current) clearInterval(animRef.current) }
  }, [selectedState, stateBounds])

  const vbString = `${viewBox.x.toFixed(1)} ${viewBox.y.toFixed(1)} ${viewBox.w.toFixed(1)} ${viewBox.h.toFixed(1)}`

  return (
    <View style={styles.wrapper} onLayout={e => setViewW(e.nativeEvent.layout.width)}>
      <Svg width={viewW} height={viewH} viewBox={vbString} style={styles.svg}>
        <G>
          {statePaths.map(({ code, d }) => {
            const isSelected = selectedState === code
            return (
              <Path
                key={code}
                d={d}
                fill={isSelected ? '#f59e0b' : (STATE_COLORS[code] ?? '#334155')}
                stroke="#0f172a"
                strokeWidth={isSelected ? 2.5 : 0.7}
                onPress={() => onSelectState(isSelected ? null : code)}
              />
            )
          })}
        </G>
      </Svg>

      <View style={styles.legend}>
        {LEGEND.map(item => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
          </View>
        ))}
        {selectedState && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => onSelectState(null)}>
            <Text style={styles.clearText}>✕ {selectedState}</Text>
          </TouchableOpacity>
        )}
      </View>
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
    alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 8,
    backgroundColor: '#0f172a',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 9, height: 9, borderRadius: 2 },
  legendLabel: { fontSize: 9, color: '#94a3b8', fontWeight: '700' },
  clearBtn: {
    backgroundColor: '#f59e0b', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  clearText: { fontSize: 10, fontWeight: '800', color: '#000' },
})
