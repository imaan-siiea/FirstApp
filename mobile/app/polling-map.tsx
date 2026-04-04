import { useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native'
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useAppStore } from '../lib/store'
import { api } from '../lib/api'

export default function PollingMapScreen() {
  const address = useAppStore((s) => s.address)
  const [selected, setSelected] = useState<number | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['polling-places', address],
    queryFn: () => api.getPollingPlaces(address!),
    enabled: !!address,
  })

  const places = data?.places ?? []

  // Default region: center of US, zooms to places if available
  const region = places.length > 0
    ? {
        latitude: places[0].lat,
        longitude: places[0].lng,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }
    : {
        latitude: 37.0902,
        longitude: -95.7129,
        latitudeDelta: 40,
        longitudeDelta: 40,
      }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Polling Places</Text>
        <Text style={styles.headerSubtitle} numberOfLines={1}>Near {address ?? 'your address'}</Text>
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1e3a5f" />
          <Text style={styles.loadingText}>Finding nearby polling places…</Text>
        </View>
      )}

      {!isLoading && isError && (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>📍</Text>
          <Text style={styles.errorTitle}>Map unavailable</Text>
          <Text style={styles.errorBody}>
            Polling place map requires a Mapbox token. Check your state's official election website for your assigned polling location.
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !isError && (
        <>
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={region}
            showsUserLocation
            showsMyLocationButton
          >
            {places.map((place, i) => (
              <Marker
                key={i}
                coordinate={{ latitude: place.lat, longitude: place.lng }}
                title={place.name}
                description={place.address}
                pinColor={selected === i ? '#4f46e5' : '#1e3a5f'}
                onPress={() => setSelected(i)}
              />
            ))}
          </MapView>

          {places.length === 0 ? (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>
                No polling places found near this address. Check your official state election website for your assigned location.
              </Text>
            </View>
          ) : (
            <FlatList
              data={places}
              keyExtractor={(_, i) => String(i)}
              style={styles.list}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[styles.placeCard, selected === index && styles.placeCardSelected]}
                  onPress={() => setSelected(index)}
                >
                  <View style={styles.placeIcon}>
                    <Text style={styles.placeIconText}>🗳️</Text>
                  </View>
                  <View style={styles.placeInfo}>
                    <Text style={styles.placeName}>{item.name}</Text>
                    <Text style={styles.placeAddress}>{item.address}</Text>
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
            />
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

  header: { backgroundColor: '#1e3a5f', padding: 20, paddingTop: 52, paddingBottom: 16 },
  backBtn: { marginBottom: 10 },
  backText: { color: '#93c5fd', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 2 },
  headerSubtitle: { fontSize: 13, color: '#93c5fd' },

  map: { height: 280, width: '100%' },

  list: { flex: 1 },
  placeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10,
    padding: 12, marginBottom: 8, marginHorizontal: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
    borderWidth: 2, borderColor: 'transparent',
  },
  placeCardSelected: { borderColor: '#4f46e5' },
  placeIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  placeIconText: { fontSize: 16 },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  placeAddress: { fontSize: 12, color: '#64748b', lineHeight: 16 },

  noResults: { padding: 24 },
  noResultsText: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },

  loadingText: { marginTop: 12, color: '#64748b', fontSize: 14 },
  errorIcon: { fontSize: 48, marginBottom: 12 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#1e3a5f', marginBottom: 8 },
  errorBody: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  backButton: { backgroundColor: '#1e3a5f', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  backButtonText: { color: '#fff', fontWeight: '600' },
})
