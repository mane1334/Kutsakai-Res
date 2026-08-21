import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Dish } from '../types';
import StarRating from './StarRating';
import { Theme } from '../themes';
import { resolveImageUrl } from '../utils/urlUtils';

interface DishCardProps {
    item: Dish;
    onRate: (id: number, rating: number) => void;
    onAddToCart: (dish: Dish) => void;
    onPress: () => void;
    theme: Theme;
    currencySymbol?: string;
}

const DishCard: React.FC<DishCardProps> = ({ item, onRate, onAddToCart, onPress, theme, currencySymbol = 'MT' }) => {
    const primaryColor = theme?.colors?.primary || '#dc2626';
    const formatCurrency = (val: number) => `${currencySymbol} ${parseFloat(String(val)).toFixed(2)}`;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.94}
            style={styles.card}
        >
            <View style={styles.imageWrapper}>
                <Image
                    source={{ uri: resolveImageUrl(item.image_url) }}
                    style={styles.image}
                    defaultSource={{ uri: 'https://via.placeholder.com/300x200?text=Prato' }}
                />
                <View style={styles.imageOverlay} pointerEvents="none">
                    <View style={styles.glassEffect}>
                        <Text style={styles.overlayText}>Ver Detalhes</Text>
                    </View>
                </View>
                <View style={styles.imageShade} pointerEvents="none" />
            </View>

            <View style={styles.content}>
                <View style={styles.kickerRow}>
                    <View style={styles.kickerDot} />
                    <Text style={styles.kickerText}>{item.category_name || 'Especial da casa'}</Text>
                </View>

                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.description} numberOfLines={3}>{item.description}</Text>

                <View style={styles.footer}>
                    <View style={styles.priceBlock}>
                        <Text style={styles.priceLabel}>Preco</Text>
                        <Text style={[styles.price, { color: primaryColor }]}>{formatCurrency(item.price)}</Text>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity onPress={onPress} style={styles.detailBtn} activeOpacity={0.88}>
                            <Text style={styles.detailBtnText}>Ver Mais</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => onAddToCart(item)}
                            style={[styles.addBtn, { backgroundColor: primaryColor, shadowColor: primaryColor }]}
                            activeOpacity={0.84}
                        >
                            <Text style={styles.addBtnText}>Pedir</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.ratingRow}>
                    <StarRating rating={item.average_rating || 0} onRate={(n) => onRate(item.id, n)} size={11} readOnly />
                    <Text style={styles.ratingLabel}>{(item.average_rating || 0).toFixed(1)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 28,
        marginBottom: 24,
        width: '48%',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 8,
    },
    imageWrapper: {
        width: '100%',
        height: 186,
        position: 'relative',
        backgroundColor: '#e5e7eb',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 16,
    },
    imageShade: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 68,
        backgroundColor: 'rgba(15,23,42,0.16)',
    },
    glassEffect: {
        backgroundColor: 'rgba(255,255,255,0.88)',
        paddingHorizontal: 13,
        paddingVertical: 7,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.65)',
    },
    overlayText: {
        color: '#6b7280',
        fontWeight: '700',
        fontSize: 11,
    },
    content: {
        padding: 18,
    },
    kickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    kickerDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#f59e0b',
    },
    kickerText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: '#9a3412',
    },
    name: {
        fontSize: 20,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 7,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 20,
        marginBottom: 18,
        minHeight: 60,
    },
    footer: {
        flexDirection: 'column',
        gap: 14,
    },
    priceBlock: {
        gap: 2,
    },
    priceLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
        color: '#94a3b8',
    },
    price: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.9,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    detailBtn: {
        flex: 1.05,
        backgroundColor: '#f8fafc',
        paddingVertical: 14,
        borderRadius: 999,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    detailBtnText: {
        color: '#475569',
        fontWeight: '800',
        fontSize: 12,
    },
    addBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 999,
        alignItems: 'center',
        shadowOpacity: 0.22,
        shadowRadius: 10,
        elevation: 5,
    },
    addBtnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 12,
    },
    ratingRow: {
        marginTop: 12,
        opacity: 0.82,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ratingLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#64748b',
    },
});

export default React.memo(DishCard);
