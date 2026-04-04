import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native'
import Svg, { Path, G } from 'react-native-svg'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const MAP_WIDTH = SCREEN_WIDTH - 32
const MAP_HEIGHT = MAP_WIDTH * 0.62

// Simplified state positions as a grid map (easier to tap than tiny SVG paths)
// Row/col grid layout matching approximate geographic positions
const STATE_GRID: { code: string; name: string; row: number; col: number }[] = [
  { code: 'AK', name: 'Alaska', row: 5, col: 0 },
  { code: 'HI', name: 'Hawaii', row: 5, col: 2 },
  { code: 'WA', name: 'Washington', row: 0, col: 1 },
  { code: 'OR', name: 'Oregon', row: 1, col: 1 },
  { code: 'CA', name: 'California', row: 2, col: 0 },
  { code: 'ID', name: 'Idaho', row: 1, col: 2 },
  { code: 'NV', name: 'Nevada', row: 2, col: 1 },
  { code: 'AZ', name: 'Arizona', row: 3, col: 1 },
  { code: 'MT', name: 'Montana', row: 0, col: 3 },
  { code: 'WY', name: 'Wyoming', row: 1, col: 3 },
  { code: 'UT', name: 'Utah', row: 2, col: 2 },
  { code: 'CO', name: 'Colorado', row: 2, col: 3 },
  { code: 'NM', name: 'New Mexico', row: 3, col: 2 },
  { code: 'ND', name: 'North Dakota', row: 0, col: 4 },
  { code: 'SD', name: 'South Dakota', row: 1, col: 4 },
  { code: 'NE', name: 'Nebraska', row: 2, col: 4 },
  { code: 'KS', name: 'Kansas', row: 3, col: 4 },
  { code: 'OK', name: 'Oklahoma', row: 4, col: 4 },
  { code: 'TX', name: 'Texas', row: 4, col: 3 },
  { code: 'MN', name: 'Minnesota', row: 0, col: 5 },
  { code: 'IA', name: 'Iowa', row: 1, col: 5 },
  { code: 'MO', name: 'Missouri', row: 2, col: 5 },
  { code: 'AR', name: 'Arkansas', row: 3, col: 5 },
  { code: 'LA', name: 'Louisiana', row: 4, col: 5 },
  { code: 'WI', name: 'Wisconsin', row: 0, col: 6 },
  { code: 'IL', name: 'Illinois', row: 1, col: 6 },
  { code: 'MS', name: 'Mississippi', row: 3, col: 6 },
  { code: 'TN', name: 'Tennessee', row: 2, col: 6 },
  { code: 'AL', name: 'Alabama', row: 3, col: 7 },
  { code: 'MI', name: 'Michigan', row: 0, col: 7 },
  { code: 'IN', name: 'Indiana', row: 1, col: 7 },
  { code: 'KY', name: 'Kentucky', row: 2, col: 7 },
  { code: 'GA', name: 'Georgia', row: 3, col: 8 },
  { code: 'FL', name: 'Florida', row: 4, col: 8 },
  { code: 'OH', name: 'Ohio', row: 1, col: 8 },
  { code: 'WV', name: 'West Virginia', row: 2, col: 8 },
  { code: 'NC', name: 'North Carolina', row: 2, col: 9 },
  { code: 'SC', name: 'South Carolina', row: 3, col: 9 },
  { code: 'PA', name: 'Pennsylvania', row: 1, col: 9 },
  { code: 'NY', name: 'New York', row: 0, col: 9 },
  { code: 'VA', name: 'Virginia', row: 2, col: 9 },
  { code: 'MD', name: 'Maryland', row: 2, col: 10 },
  { code: 'DE', name: 'Delaware', row: 1, col: 10 },
  { code: 'NJ', name: 'New Jersey', row: 1, col: 10 },
  { code: 'CT', name: 'Connecticut', row: 0, col: 10 },
  { code: 'RI', name: 'Rhode Island', row: 0, col: 11 },
  { code: 'MA', name: 'Massachusetts', row: 0, col: 10 },
  { code: 'VT', name: 'Vermont', row: 0, col: 10 },
  { code: 'NH', name: 'New Hampshire', row: 0, col: 11 },
  { code: 'ME', name: 'Maine', row: 0, col: 11 },
]

const COLS = 12
const ROWS = 6
const CELL = Math.floor(MAP_WIDTH / COLS)

// Deduplicate grid positions
const positionedStates = STATE_GRID.map((s, i) => {
  // Find if another state occupies the same spot
  const sameSpot = STATE_GRID.slice(0, i).filter(
    o => o.row === s.row && o.col === s.col
  )
  return { ...s, colOffset: sameSpot.length * 0 } // stack handling simplified
})

interface UsMapProps {
  selectedState: string | null
  onSelectState: (code: string | null) => void
}

export function UsMap({ selectedState, onSelectState }: UsMapProps) {
  const rows: Record<number, { code: string; name: string; col: number }[]> = {}
  for (const s of STATE_GRID) {
    if (!rows[s.row]) rows[s.row] = []
    rows[s.row].push({ code: s.code, name: s.name, col: s.col })
  }

  // Build a 6x12 grid
  const grid: (typeof STATE_GRID[0] | null)[][] = Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
  for (const s of STATE_GRID) {
    // Handle collisions by shifting right
    let col = s.col
    while (col < COLS && grid[s.row][col] !== null) col++
    if (col < COLS) grid[s.row][col] = s
  }

  const cellSize = Math.floor(MAP_WIDTH / COLS)
  const height = cellSize * ROWS

  return (
    <View style={styles.container}>
      <View style={[styles.grid, { width: MAP_WIDTH, height }]}>
        {grid.flatMap((row, rowIdx) =>
          row.map((state, colIdx) => {
            if (!state) return null
            const isSelected = selectedState === state.code
            return (
              <TouchableOpacity
                key={state.code}
                style={[
                  styles.cell,
                  {
                    left: colIdx * cellSize,
                    top: rowIdx * cellSize,
                    width: cellSize - 2,
                    height: cellSize - 2,
                    backgroundColor: isSelected ? '#1e3a5f' : '#dbeafe',
                    borderColor: isSelected ? '#1e3a5f' : '#93c5fd',
                  },
                ]}
                onPress={() => onSelectState(isSelected ? null : state.code)}
              >
                <Text style={[styles.stateCode, isSelected && styles.stateCodeSelected]}>
                  {state.code}
                </Text>
              </TouchableOpacity>
            )
          })
        )}
      </View>

      {selectedState && (
        <TouchableOpacity onPress={() => onSelectState(null)} style={styles.clearBtn}>
          <Text style={styles.clearText}>✕ Clear — showing all states</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, marginBottom: 8 },
  grid: { position: 'relative' },
  cell: {
    position: 'absolute',
    borderRadius: 3,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateCode: { fontSize: 8, fontWeight: '700', color: '#1e3a5f' },
  stateCodeSelected: { color: '#fff' },
  clearBtn: {
    marginTop: 6,
    alignSelf: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
})
