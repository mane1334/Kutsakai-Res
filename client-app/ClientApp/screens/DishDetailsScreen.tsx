import React, { useMemo, useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
    Pressable,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import StarRating from '../components/StarRating';
import { Dish } from '../types';
import { Theme } from '../themes';
import { resolveImageUrl } from '../utils/urlUtils';

interface DishDetailsScreenProps {
    route: any;
    navigation: any;
    onAddToCart: (dish: Dish, quantity: number) => void;
    onRate: (dishId: number, rating: number) => void;
    theme: Theme;
    baseUrl: string;
    currencySymbol?: string;
    ratingsEnabled?: boolean;
    restaurantId?: string;
}

const RED_WEB = '#dc2626';

const parseImageUrls = (value: Dish['image_urls']) => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value !== 'string' || !value.trim()) return [];
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch (_) { }
    return value.split('\n').map((item) => item.trim()).filter(Boolean);
};

const DishDetailsScreen: React.FC<DishDetailsScreenProps> = ({
    route,
    navigation,
    onAddToCart,
    onRate,
    theme,
    baseUrl,
    currencySymbol = 'MT',
    ratingsEnabled = true,
    restaurantId = '1',
}) => {
    const { dish }: { dish: Dish } = route.params;
    const { width, height } = useWindowDimensions();
    const [quantity, setQuantity] = useState(1);
    const [rating, setRating] = useState(dish?.average_rating || 0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const [isImageViewerOpen, setImageViewerOpen] = useState(false);

    if (!dish) return null;

    const primaryColor = theme?.colors?.primary || RED_WEB;
    const isWideLayout = width >= 900;
    const panelWidth = Math.min(width - 32, isWideLayout ? 980 : 760);
    const panelHeight = Math.min(height - 28, isWideLayout ? 710 : height - 20);
    const formatCurrency = (val: number) => `${currencySymbol} ${parseFloat(String(val)).toFixed(2)}`;
    const imageGallery = useMemo(() => {
        const values = [dish.image_url, ...parseImageUrls(dish.image_urls)];
        return Array.from(new Set(values.filter(Boolean) as string[]));
    }, [dish.image_url, dish.image_urls]);
    const imageUri = useMemo(
        () => resolveImageUrl(selectedImageUrl || imageGallery[0] || dish.image_url, route.params?.baseUrl || baseUrl),
        [selectedImageUrl, imageGallery, dish.image_url, route.params?.baseUrl, baseUrl]
    );

    const openImageViewer = () => {
        if (!imageUri || imageFailed) return;
        setImageViewerOpen(true);
    };

    const [reviews, setReviews] = useState<any[]>([]);

    useEffect(() => {
        if (ratingsEnabled && dish?.name) {
            fetch(`${baseUrl}/api/ratings`, { headers: { 'x-restaurant-id': restaurantId } })
                .then(res => res.json())
                .then(data => {
                    const filtered = data.filter((r: any) => r.dish_name === dish.name);
                    setReviews(filtered.slice(0, 5));
                })
                .catch((e: any) => { if (__DEV__) console.error(e); });
        }
    }, [baseUrl, dish?.name, ratingsEnabled, restaurantId]);

    const handleAddToCart = () => {
        onAddToCart(dish, quantity);
        navigation.goBack();
    };

    const handleSubmitRating = () => {
        if (rating === 0) {
            Alert.alert('Aviso', 'Por favor, selecione uma avaliacao de 1 a 5 estrelas.');
            return;
        }

        setIsSubmitting(true);
        setTimeout(() => {
            onRate(dish.id, rating);
            Alert.alert('Obrigado!', 'Sua avaliacao foi enviada.');
            setIsSubmitting(false);
            setRating(0);
            setComment('');
        }, 1000);
    };

    return (
        <SafeAreaView style={styles.overlaySafeArea} edges={['top', 'bottom']}>
            <Pressable style={styles.backdrop} onPress={() => navigation.goBack()} />

            <View style={[styles.modalShell, { width: panelWidth, height: panelHeight }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.closeBtn}
                    activeOpacity={0.85}
                >
                    <Text style={styles.closeBtnText}>X</Text>
                </TouchableOpacity>

                <View style={styles.modalBody}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                        style={styles.scrollView}
                    >
                        <View style={[styles.imageContainer, isWideLayout && styles.imageContainerWide]}>
                            {!imageFailed ? (
                                <TouchableOpacity activeOpacity={0.92} onPress={openImageViewer} style={styles.imageTapArea}>
                                    <Image
                                        source={{ uri: imageUri }}
                                        style={styles.image}
                                        onError={() => setImageFailed(true)}
                                    />
                                </TouchableOpacity>
                            ) : (
                                <LinearGradient
                                    colors={['#1f2937', '#374151', '#6b7280']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.imageFallback}
                                >
                                    <Text style={styles.imageFallbackBadge}>Prato da Casa</Text>
                                    <Text style={styles.imageFallbackHint}>Imagem indisponivel no momento</Text>
                                </LinearGradient>
                            )}

                            <LinearGradient
                                colors={['rgba(15,23,42,0.05)', 'rgba(15,23,42,0.84)']}
                                style={styles.imageTitleOverlay}
                            >
                                <View style={styles.imageMetaRow}>
                                    <View style={styles.heroPill}>
                                        <Text style={styles.heroPillText}>Detalhes do Prato</Text>
                                    </View>
                                    {dish.average_rating ? (
                                        <View style={styles.heroRatingPill}>
                                            <Text style={styles.heroRatingText}>{dish.average_rating.toFixed(1)} estrelas</Text>
                                        </View>
                                    ) : null}
                                </View>
                                <Text style={styles.imageTitleText}>{dish.name}</Text>
                                <Text style={styles.imageSubtitleText}>
                                    {!imageFailed
                                        ? 'Veja a descricao, ajuste a quantidade e finalize o pedido com conforto.'
                                        : 'Uma apresentacao premium do prato sera exibida assim que a imagem estiver disponivel.'}
                                </Text>
                            </LinearGradient>
                        </View>

                        {imageGallery.length > 1 ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailStrip}>
                                {imageGallery.map((url) => {
                                    const resolved = resolveImageUrl(url, route.params?.baseUrl || baseUrl);
                                    const isSelected = resolved === imageUri;
                                    return (
                                        <TouchableOpacity
                                            key={url}
                                            activeOpacity={0.85}
                                            onPress={() => {
                                                setImageFailed(false);
                                                setSelectedImageUrl(url);
                                            }}
                                            style={[styles.thumbnailButton, isSelected && styles.thumbnailButtonActive]}
                                        >
                                            <Image source={{ uri: resolved }} style={styles.thumbnailImage} />
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        ) : null}

                        <View style={styles.contentPad}>
                            <View style={styles.summaryCard}>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>Preco Base</Text>
                                    <Text style={styles.summaryValue}>{formatCurrency(dish.price)}</Text>
                                </View>
                                <View style={styles.summaryDivider} />
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>Quantidade</Text>
                                    <Text style={styles.summaryValue}>{quantity}</Text>
                                </View>
                                <View style={styles.summaryDivider} />
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>Total</Text>
                                    <Text style={[styles.summaryValue, styles.summaryValueAccent]}>
                                        {formatCurrency(dish.price * quantity)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Descricao</Text>
                                <Text style={styles.descriptionText}>{dish.description}</Text>
                            </View>

                            {(dish.preparation_time || dish.calories) ? (
                                <View style={styles.badgeRow}>
                                    {dish.preparation_time ? (
                                        <View style={styles.prepBadge}>
                                            <Text style={styles.prepBadgeText}>{dish.preparation_time} min</Text>
                                        </View>
                                    ) : null}
                                    {dish.calories ? (
                                        <View style={styles.calBadge}>
                                            <Text style={styles.calBadgeText}>{dish.calories} kcal</Text>
                                        </View>
                                    ) : null}
                                </View>
                            ) : null}

                            {ratingsEnabled ? (
                                <>
                                    <View style={styles.divider} />

                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>Avalie este prato</Text>
                                        <View style={styles.ratingCenter}>
                                            <StarRating rating={rating} onRate={(n) => setRating(n)} size={34} />
                                        </View>
                                        <TextInput
                                            value={comment}
                                            onChangeText={setComment}
                                            placeholder="Deixe um comentario (opcional)"
                                            placeholderTextColor="#9ca3af"
                                            style={styles.commentInput}
                                            multiline
                                            numberOfLines={3}
                                        />
                                    </View>

                                    {reviews.length > 0 && (
                                        <View style={[styles.section, { marginTop: 12 }]}>
                                            <Text style={styles.sectionTitle}>Avaliações Recentes</Text>
                                            {reviews.map((rev, i) => (
                                                <View key={rev.id || i} style={styles.reviewCard}>
                                                    <View style={styles.reviewHeader}>
                                                        <StarRating rating={rev.rating} onRate={()=>{}} size={14} readOnly />
                                                        <Text style={styles.reviewDate}>
                                                            {new Date(rev.created_at).toLocaleDateString('pt-BR')}
                                                        </Text>
                                                    </View>
                                                    <Text style={styles.reviewComment}>
                                                        {rev.comment ? `"${rev.comment}"` : 'Sem comentário.'}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </>
                            ) : null}
                        </View>
                    </ScrollView>

                    <View style={styles.bottomDock}>
                        {ratingsEnabled ? (
                            <TouchableOpacity
                                style={[
                                    styles.submitRatingBtn,
                                    { backgroundColor: primaryColor },
                                    (rating === 0 || isSubmitting) && styles.btnDisabled,
                                ]}
                                onPress={handleSubmitRating}
                                disabled={rating === 0 || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.submitRatingText}>Enviar Avaliacao</Text>
                                )}
                            </TouchableOpacity>
                        ) : null}

                        <View style={styles.footerActionRow}>
                            <View>
                                <Text style={styles.priceLabel}>Preco</Text>
                                <Text style={styles.priceValue}>{formatCurrency(dish.price)}</Text>
                            </View>

                            <View style={styles.qtyContainer}>
                                <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qtyBtn}>
                                    <Text style={styles.qtyBtnText}>-</Text>
                                </TouchableOpacity>
                                <Text style={styles.qtyText}>{quantity}</Text>
                                <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.qtyBtn}>
                                    <Text style={styles.qtyBtnText}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity onPress={handleAddToCart} activeOpacity={0.92}>
                            <LinearGradient
                                colors={[primaryColor, primaryColor]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.orderBtn, { shadowColor: primaryColor }]}
                            >
                                <Text style={styles.orderBtnText}>Pedir - {formatCurrency(dish.price * quantity)}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <Modal visible={isImageViewerOpen} transparent animationType="fade" onRequestClose={() => setImageViewerOpen(false)}>
                <View style={styles.viewerOverlay}>
                    <TouchableOpacity style={styles.viewerClose} onPress={() => setImageViewerOpen(false)}>
                        <Text style={styles.viewerCloseText}>Fechar</Text>
                    </TouchableOpacity>
                    <Image source={{ uri: imageUri }} style={styles.viewerImage} resizeMode="contain" />
                    {imageGallery.length > 1 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.viewerThumbs}>
                            {imageGallery.map((url) => {
                                const resolved = resolveImageUrl(url, route.params?.baseUrl || baseUrl);
                                return (
                                    <TouchableOpacity
                                        key={url}
                                        onPress={() => {
                                            setSelectedImageUrl(url);
                                            setImageFailed(false);
                                        }}
                                        style={[styles.viewerThumbButton, resolved === imageUri && styles.viewerThumbButtonActive]}
                                    >
                                        <Image source={{ uri: resolved }} style={styles.viewerThumbImage} />
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    ) : null}
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    overlaySafeArea: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.44)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalShell: {
        backgroundColor: '#f8fafc',
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.7)',
        shadowColor: '#020617',
        shadowOpacity: 0.22,
        shadowRadius: 28,
        elevation: 18,
    },
    modalBody: {
        flex: 1,
        minHeight: 0,
    },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 22 },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.92)',
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 7,
    },
    closeBtnText: { color: '#1f2937', fontSize: 16, fontWeight: '800' },
    imageContainer: { width: '100%', height: 236, position: 'relative', backgroundColor: '#111827' },
    imageContainerWide: { height: 268 },
    imageTapArea: { width: '100%', height: '100%' },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    thumbnailStrip: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4, gap: 10, backgroundColor: '#f8fafc' },
    thumbnailButton: { width: 78, height: 58, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', backgroundColor: '#e5e7eb' },
    thumbnailButtonActive: { borderColor: RED_WEB },
    thumbnailImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    imageFallback: { width: '100%', height: '100%', paddingHorizontal: 26, paddingVertical: 28, justifyContent: 'flex-start' },
    imageFallbackBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.16)',
        color: '#fff',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        overflow: 'hidden',
        fontWeight: '800',
        marginBottom: 14,
    },
    imageFallbackHint: {
        color: 'rgba(255,255,255,0.76)',
        fontSize: 14,
        lineHeight: 20,
        maxWidth: 220,
        marginTop: 10,
    },
    imageTitleOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingTop: 28,
        paddingBottom: 24,
    },
    imageMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    heroPill: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
    },
    heroPillText: { color: '#fff', fontWeight: '800', fontSize: 13 },
    heroRatingPill: {
        backgroundColor: 'rgba(254,242,242,0.96)',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
    },
    heroRatingText: { color: '#b91c1c', fontWeight: '800', fontSize: 12 },
    imageTitleText: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.7 },
    imageSubtitleText: { color: 'rgba(255,255,255,0.82)', fontSize: 15, lineHeight: 22, marginTop: 8, maxWidth: 440 },
    contentPad: { padding: 18, backgroundColor: '#f8fafc' },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 26,
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginTop: -22,
        marginBottom: 14,
        shadowColor: '#0f172a',
        shadowOpacity: 0.08,
        shadowRadius: 18,
        elevation: 6,
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryLabel: { color: '#64748b', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
    summaryValue: { color: '#0f172a', fontSize: 19, fontWeight: '900' },
    summaryValueAccent: { color: RED_WEB },
    summaryDivider: { width: 1, alignSelf: 'stretch', backgroundColor: '#e2e8f0', marginHorizontal: 12 },
    section: { marginBottom: 10 },
    sectionTitle: { fontSize: 19, fontWeight: '800', color: '#0f172a', marginBottom: 10 },
    descriptionText: { fontSize: 15, color: '#4b5563', lineHeight: 24 },
    badgeRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
    prepBadge: { backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
    prepBadgeText: { color: '#b91c1c', fontWeight: '700', fontSize: 14 },
    calBadge: { backgroundColor: '#fff7ed', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
    calBadgeText: { color: '#c2410c', fontWeight: '700', fontSize: 14 },
    divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 10 },
    ratingCenter: { alignItems: 'center', marginBottom: 8 },
    commentInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 18,
        padding: 16,
        fontSize: 15,
        color: '#111',
        minHeight: 84,
        textAlignVertical: 'top',
        marginBottom: 8,
    },
    bottomDock: {
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderColor: '#e5e7eb',
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 16,
        shadowColor: '#0f172a',
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 8,
    },
    submitRatingBtn: {
        paddingVertical: 13,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    btnDisabled: { opacity: 0.5 },
    submitRatingText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    footerActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    priceLabel: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
    priceValue: { fontSize: 28, fontWeight: '900', color: RED_WEB, letterSpacing: -1 },
    qtyContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    qtyBtn: {
        backgroundColor: '#e5e7eb',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyBtnText: { fontSize: 24, fontWeight: '600', color: '#4b5563' },
    qtyText: { fontSize: 20, fontWeight: '800', color: '#111', minWidth: 32, textAlign: 'center' },
    orderBtn: {
        paddingVertical: 14,
        borderRadius: 99,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: RED_WEB,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 6,
    },
    reviewCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 10,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    reviewDate: {
        fontSize: 12,
        color: '#94a3b8',
    },
    reviewComment: {
        fontSize: 14,
        color: '#475569',
        fontStyle: 'italic',
    },
    orderBtnText: { color: '#fff', fontWeight: '900', fontSize: 18 },
    viewerOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.96)', alignItems: 'center', justifyContent: 'center', padding: 18 },
    viewerClose: { position: 'absolute', top: 42, right: 20, zIndex: 2, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
    viewerCloseText: { color: '#fff', fontWeight: '800' },
    viewerImage: { width: '100%', height: '78%' },
    viewerThumbs: { position: 'absolute', bottom: 24, paddingHorizontal: 18, gap: 10 },
    viewerThumbButton: { width: 72, height: 54, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.24)' },
    viewerThumbButtonActive: { borderColor: '#fff' },
    viewerThumbImage: { width: '100%', height: '100%', resizeMode: 'cover' },
});

export default DishDetailsScreen;
