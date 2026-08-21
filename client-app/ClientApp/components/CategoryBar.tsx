import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Theme } from '../themes';

interface CategoryBarProps {
    categories: string[];
    categoryCounts: Record<string, number>;
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
    theme: Theme;
    compact?: boolean;
}

const CategoryBar: React.FC<CategoryBarProps> = ({ categories, categoryCounts, selectedCategory, onSelectCategory, theme, compact = false }) => {
    const activeColor = theme?.colors?.primary || '#dc2626';

    return (
        <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, compact && styles.scrollContentCompact]}
            >
                {categories.map((cat) => {
                    const isActive = selectedCategory === cat;
                    return (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => onSelectCategory(cat)}
                            activeOpacity={0.8}
                            style={[
                                styles.pill,
                                compact && styles.pillCompact,
                                isActive ? styles.pillActive : styles.pillInactive,
                                isActive ? { backgroundColor: activeColor, borderColor: activeColor, shadowColor: activeColor } : null,
                            ]}
                        >
                            <Text style={[styles.pillText, compact && styles.pillTextCompact, isActive ? styles.pillTextActive : styles.pillTextInactive]}>{cat}</Text>
                            <View style={[styles.countBadge, compact && styles.countBadgeCompact, isActive ? styles.countBadgeActive : styles.countBadgeInactive]}>
                                <Text style={[styles.countBadgeText, compact && styles.countBadgeTextCompact, isActive ? styles.countBadgeTextActive : styles.countBadgeTextInactive]}>
                                    {categoryCounts[cat] ?? 0}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};


const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#f3f4f6',
        paddingVertical: 6,
        width: '100%',
        flexGrow: 0,
        flexShrink: 0,
    },
    wrapperCompact: { paddingVertical: 4 },
    scrollView: {
        flexGrow: 0,
        flexShrink: 0,
    },
    scrollContent: {
        paddingHorizontal: 14,
        gap: 8,
        alignItems: 'center',
    },
    scrollContentCompact: { paddingHorizontal: 12, gap: 6 },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 99,
        borderWidth: 1,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    pillCompact: {
        gap: 6,
        paddingHorizontal: 15,
        paddingVertical: 6,
    },
    pillActive: {
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    pillInactive: {
        backgroundColor: '#fff',
        borderColor: '#e5e7eb',
    },
    pillText: { fontWeight: '600', fontSize: 13 },
    pillTextCompact: { fontSize: 12 },
    pillTextActive: { color: '#fff' },
    pillTextInactive: { color: '#374151' },
    countBadge: {
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
    },
    countBadgeCompact: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
    },
    countBadgeActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
    countBadgeInactive: { backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#fecaca' },
    countBadgeText: { fontSize: 11, fontWeight: '700' },
    countBadgeTextCompact: { fontSize: 10 },
    countBadgeTextActive: { color: '#fff' },
    countBadgeTextInactive: { color: '#dc2626' },
});

export default CategoryBar;
