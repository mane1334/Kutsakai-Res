import React from 'react';
import { View, FlatList, Image, StyleSheet, Dimensions, Text } from 'react-native';
import { AdItem } from '../types';

interface AdCarouselProps {
    ads: AdItem[];
    fullScreen?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AdCarousel: React.FC<AdCarouselProps> = ({ ads, fullScreen = false }) => {
    const flatListRef = React.useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
        if (!ads || ads.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => {
                const next = (prev + 1) % ads.length;
                flatListRef.current?.scrollToIndex({ index: next, animated: true });
                return next;
            });
        }, 5000);
        return () => clearInterval(interval);
    }, [ads]);

    if (!ads || ads.length === 0) return null;

    return (
        <View style={[styles.adContainer, fullScreen && styles.fullScreenContainer]}>
            <FlatList
                ref={flatListRef}
                data={ads}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <View style={[styles.adCard, fullScreen && styles.fullScreenCard]}>
                        <Image source={{ uri: item.image_url }} style={styles.adImage} />
                        {fullScreen && (
                            <View style={styles.screensaverTextContainer}>
                                <Text style={styles.screensaverText}>Toque para ativar</Text>
                            </View>
                        )}
                    </View>
                )}
                onMomentumScrollEnd={(ev) => {
                    const idx = Math.round(ev.nativeEvent.contentOffset.x / (fullScreen ? SCREEN_WIDTH : 360));
                    setCurrentIndex(idx);
                }}
            />

            {!fullScreen && ads.length > 1 && (
                <View style={styles.dotsRow}>
                    {ads.map((_, index) => (
                        <View key={index} style={[styles.dot, index === currentIndex && styles.dotActive]} />
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    adContainer: { height: 256, marginTop: 18, marginBottom: 6, paddingHorizontal: 18 },
    fullScreenContainer: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, marginVertical: 0, position: 'absolute', top: 0, left: 0, zIndex: 2000, backgroundColor: '#000' },
    adCard: {
        width: Math.min(SCREEN_WIDTH - 340, 620),
        height: 226,
        marginLeft: 0,
        marginRight: 14,
        borderRadius: 30,
        overflow: 'hidden',
        shadowColor: '#0f172a',
        shadowOpacity: 0.16,
        shadowRadius: 18,
        elevation: 8,
        position: 'relative',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.42)',
    },
    fullScreenCard: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, marginLeft: 0, borderRadius: 0 },
    adImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    screensaverTextContainer: { position: 'absolute', bottom: 100, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30 },
    screensaverText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12, gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d1d5db' },
    dotActive: { backgroundColor: '#dc2626', width: 18 },
});

export default AdCarousel;
