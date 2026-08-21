import React, { useCallback, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    Image,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

import DishCard from '../components/DishCard';
import CategoryBar from '../components/CategoryBar';
import { Dish, CartItem, AdItem, Settings, Order } from '../types';
import { isRestaurantOpen } from '../utils/openingHours';
import { Theme } from '../themes';
import { getOrderStatusLabel } from '../utils/orderStatus';

interface HomeScreenProps {
    navigation: any;
    menu: Dish[];
    activeAds: AdItem[];
    categories: string[];
    selectedCategory: string;
    setSelectedCategory: (cat: string) => void;
    isLoading: boolean;
    error: string | null;
    retryFetch: () => void;
    addToCart: (dish: Dish) => void;
    handleRateDish: (id: number, rating: number) => void;
    settings: Settings | null;
    theme: Theme;
    tableNumber: string;
    cart: CartItem[];
    currentOrder: Order | null;
    t: (key: string) => string;
    chatEnabled: boolean;
    adsEnabled: boolean;
    currencySymbol: string;
    onOpenSettings: () => void;
    onLock: () => void;
    onCallWaiter: () => void;
    onOpenChat: () => void;
    onOpenCart: () => void;
    onCancelOrder: () => void;
    baseUrl: string;
    wsStatus: 'connecting' | 'open' | 'closed' | 'error';
}

const ITEM_HEIGHT = 420; // Approximate height for getItemLayout

const HomeScreen: React.FC<HomeScreenProps> = ({
    navigation,
    menu,
    categories,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    error,
    retryFetch,
    addToCart,
    handleRateDish,
    settings,
    theme,
    tableNumber,
    cart,
    currentOrder,
    t,
    chatEnabled,
    currencySymbol,
    onOpenSettings,
    onLock,
    onCallWaiter,
    onOpenChat,
    onOpenCart,
    onCancelOrder,
    baseUrl,
    wsStatus,
}) => {
    const { width } = useWindowDimensions();
    const isWideScreen = width >= 1000;
    const primaryColor = theme.colors.primary || '#dc2626';

    const filteredMenu = useMemo(() =>
        selectedCategory === 'Todos'
            ? menu
            : menu.filter((dish) => dish.category_name === selectedCategory),
        [menu, selectedCategory]
    );

    const isOpen = isRestaurantOpen(settings?.opening_hours, settings?.closing_hours);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const currentOrderMinutes = currentOrder?.prepSeconds ? Math.max(1, Math.ceil(currentOrder.prepSeconds / 60)) : null;

    const categoryCounts = useMemo(() =>
        categories.reduce<Record<string, number>>((acc, category) => {
            acc[category] = category === 'Todos'
                ? menu.length
                : menu.filter((dish) => dish.category_name === category).length;
            return acc;
        }, {}),
        [categories, menu]
    );

    // Performance: memoized renderItem + keyExtractor
    const renderItem = useCallback(({ item }: { item: Dish }) => (
        <DishCard
            item={item}
            onRate={handleRateDish}
            onAddToCart={addToCart}
            onPress={() => navigation.navigate('DishDetails', { dish: item, baseUrl })}
            theme={theme}
            currencySymbol={currencySymbol}
        />
    ), [handleRateDish, addToCart, navigation, baseUrl, theme, currencySymbol]);

    const keyExtractor = useCallback((item: Dish) => String(item.id), []);

    const getItemLayout = useCallback((_: any, index: number) => ({
        length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index,
    }), []);

    const RightRail = () => {
        if (!isWideScreen) return null;

        return (
            <View style={styles.rightRail}>
                <View style={styles.diagCard}>
                    <Text style={styles.diagTitle}>Diag</Text>
                    <Text style={styles.diagText}>API: {error ? 'Fail' : 'OK'}</Text>
                    <Text style={styles.diagText}>WS: {wsStatus}</Text>
                </View>

                <View style={styles.railCard}>
                    <Text style={styles.railCardTitle}>Pedido</Text>
                    {currentOrder ? (
                        <>
                            <Text style={styles.railCardBody}>Seu pedido foi enviado para a cozinha.</Text>
                            <View style={styles.orderInfoChip}>
                                <Text style={styles.orderInfoChipText}>{getOrderStatusLabel(currentOrder.status)}</Text>
                            </View>
                            <Text style={styles.railMutedText}>Mesa {tableNumber} em andamento.</Text>
                            <TouchableOpacity style={[styles.railPrimaryBtn, { backgroundColor: primaryColor, shadowColor: primaryColor }]} onPress={onOpenCart}>
                                <Text style={styles.railPrimaryBtnText}>Ver Pedido</Text>
                            </TouchableOpacity>
                        </>
                    ) : cartCount > 0 ? (
                        <>
                            <Text style={styles.railCardBody}>{cartCount} item(ns) pronto(s) para confirmar.</Text>
                            <TouchableOpacity style={[styles.railPrimaryBtn, { backgroundColor: primaryColor, shadowColor: primaryColor }]} onPress={onOpenCart}>
                                <Text style={styles.railPrimaryBtnText}>Finalizar</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.railCardBody}>Nenhum pedido ativo no momento.</Text>
                            <Text style={styles.railMutedText}>Escolha alguns pratos para comecar.</Text>
                        </>
                    )}
                </View>

                <View style={styles.railCard}>
                    <Text style={styles.railCardTitle}>Precisa de Ajuda?</Text>
                    <Text style={styles.railCardBody}>Nosso garcom estara com voce em instantes.</Text>
                    <Text style={styles.railInputLabel}>Numero da Mesa</Text>
                    <View style={styles.railInputBox}>
                        <Text style={styles.railInputText}>{tableNumber}</Text>
                    </View>
                    <TouchableOpacity style={[styles.railPrimaryBtn, styles.railHelpBtn]} onPress={onCallWaiter}>
                        <Text style={styles.railPrimaryBtnText}>Chamar Garcom</Text>
                    </TouchableOpacity>
                </View>

                {chatEnabled ? (
                    <TouchableOpacity style={[styles.railFab, { backgroundColor: primaryColor, shadowColor: primaryColor }]} onPress={onOpenChat}>
                        <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
                    </TouchableOpacity>
                ) : null}
            </View>
        );
    };

    const CatalogHeader = ({ compact = false }: { compact?: boolean }) => (
        <View style={[
            styles.menuTitleRow,
            isWideScreen && styles.menuTitleRowWide,
            compact && styles.menuTitleRowCompact,
            compact && isWideScreen && styles.menuTitleRowWideCompact,
        ]}>
            <View style={styles.menuKicker}>
                <View style={styles.menuKickerDot} />
                <Text style={styles.menuKickerText}>Menu digital</Text>
            </View>
            <Text style={[styles.menuTitle, compact && styles.menuTitleCompact]}>Nosso Cardapio</Text>
            <CategoryBar
                categories={categories}
                categoryCounts={categoryCounts}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                theme={theme}
                compact={compact}
            />
        </View>
    );

    const HeaderComponent = () => (
        <View>
            <LinearGradient
                colors={theme.colors.headerGradient || ['#991b1b', '#b91c1c', '#dc2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.headerBanner, isWideScreen && styles.headerBannerWide]}
            >
                <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.headerGradient?.[0] || '#991b1b'} />

                {!isWideScreen ? (
                    <View style={styles.diagCardMobile}>
                        <Text style={styles.diagTitleMobile}>Diag</Text>
                        <Text style={styles.diagTextMobile}>API: {error ? 'Fail' : 'OK'}</Text>
                        <Text style={styles.diagTextMobile}>WS: {wsStatus}</Text>
                    </View>
                ) : null}

                <View style={styles.headerTopRow}>
                    <TouchableOpacity onPress={onOpenSettings} style={styles.iconBtn}>
                        <Ionicons name="settings-outline" size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onLock} style={[styles.iconBtn, styles.iconBtnSecondary]}>
                        <Ionicons name="lock-closed-outline" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>

                {settings?.restaurant_logo_url ? (
                    <Image source={{ uri: settings.restaurant_logo_url }} style={styles.logo} resizeMode="contain" />
                ) : null}

                <View style={styles.titleContainer}>
                    <Text style={styles.restaurantTitle}>{settings?.restaurant_name || 'Restaurante Interactive'}</Text>
                    <Text style={styles.restaurantSlogan}>Sabor que encanta, momentos que ficam.</Text>
                </View>

                <View style={styles.statusRow}>
                    <Text style={styles.tableLabel}>Mesa {tableNumber}</Text>
                    <View style={[styles.statusIndicator, { backgroundColor: isOpen ? '#16a34a' : '#ef4444' }]} />
                    <Text style={styles.statusText}>{isOpen ? 'Aberto' : 'Fechado'}</Text>
                </View>

                <LinearGradient
                    colors={[theme.colors.warning, theme.colors.primary, theme.colors.headerGradient?.[2] || '#dc2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.webGradientBar}
                />
            </LinearGradient>

            {!isOpen ? (
                <View style={styles.closedBanner}>
                    <Text style={styles.closedBannerText}>Estamos fechados. Retorne no horario de funcionamento.</Text>
                </View>
            ) : null}
        </View>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <HeaderComponent />
                <View style={[styles.screenContent, isWideScreen && styles.screenContentWide]}>
                    <View style={styles.leftPane}>
                        <CatalogHeader compact={isWideScreen} />
                        <View style={styles.loadingWrap}>
                            <ActivityIndicator size="large" color={primaryColor} style={styles.loadingIndicator} />
                        </View>
                    </View>
                    <RightRail />
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <HeaderComponent />
                <View style={[styles.screenContent, isWideScreen && styles.screenContentWide]}>
                    <View style={styles.leftPane}>
                        <CatalogHeader compact={isWideScreen} />
                        <View style={[styles.errorContainer, isWideScreen && styles.errorContainerWide]}>
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: primaryColor }]} onPress={retryFetch}>
                                <Text style={styles.retryBtnText}>Tentar Novamente</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <RightRail />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <HeaderComponent />
            <View style={[styles.screenContent, isWideScreen && styles.screenContentWide]}>
                <View style={styles.leftPane}>
                    <CatalogHeader compact={isWideScreen} />
                    <FlatList
                        data={filteredMenu}
                        renderItem={renderItem}
                        keyExtractor={keyExtractor}
                        getItemLayout={getItemLayout}
                        numColumns={2}
                        columnWrapperStyle={styles.gridRow}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>Nenhum prato encontrado nesta categoria.</Text>
                            </View>
                        }
                        showsVerticalScrollIndicator={false}
                        style={styles.menuList}
                        removeClippedSubviews
                        maxToRenderPerBatch={6}
                        windowSize={5}
                    />
                </View>
                <RightRail />
            </View>

            {!isWideScreen && chatEnabled ? (
                <TouchableOpacity style={[styles.chatFab, { backgroundColor: primaryColor, shadowColor: primaryColor }]} onPress={onOpenChat}>
                    <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
                </TouchableOpacity>
            ) : null}
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f4f7fb' },
    screenContent: { flex: 1 },
    screenContentWide: {
        flexDirection: 'row',
        paddingHorizontal: 18,
        paddingTop: 8,
        paddingBottom: 12,
        gap: 18,
    },
    leftPane: { flex: 1, minHeight: 0 },
    headerBanner: {
        paddingTop: 10,
        paddingBottom: 2,
        paddingHorizontal: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
        elevation: 12,
        position: 'relative',
    },
    headerBannerWide: {
        paddingRight: 24,
        paddingBottom: 8,
    },
    diagCardMobile: {
        position: 'absolute',
        top: 14,
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    diagTitleMobile: { color: '#7f1d1d', fontWeight: '800', fontSize: 11 },
    diagTextMobile: { color: '#7f1d1d', fontSize: 10, marginTop: 2 },
    headerTopRow: {
        flexDirection: 'row',
        alignSelf: 'flex-end',
        gap: 8,
        marginBottom: 2,
        marginTop: 0,
    },
    iconBtn: {
        backgroundColor: 'rgba(255,255,255,0.22)',
        borderRadius: 15,
        paddingHorizontal: 13,
        paddingVertical: 9,
        minWidth: 52,
        alignItems: 'center',
    },
    iconBtnSecondary: { backgroundColor: 'rgba(255,255,255,0.15)' },
    iconBtnText: { fontSize: 11, color: '#fff', fontWeight: '800' },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    titleContainer: { maxWidth: '90%', alignItems: 'center', marginTop: 2 },
    restaurantTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
        textAlign: 'center',
        letterSpacing: -1,
        marginBottom: 6,
    },
    restaurantSlogan: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.88)',
        textAlign: 'center',
        fontWeight: '400',
        letterSpacing: 0.2,
        marginBottom: 12,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    statusIndicator: { width: 8, height: 8, borderRadius: 4 },
    statusText: { color: '#fff', fontSize: 13, fontWeight: '800' },
    tableLabel: { color: 'rgba(255,255,255,0.84)', fontSize: 13, fontWeight: '600' },
    webGradientBar: { height: 4, width: '120%', marginHorizontal: -20 },
    closedBanner: {
        backgroundColor: '#fef3c7',
        paddingVertical: 11,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: '#fde68a',
    },
    closedBannerText: { color: '#92400e', textAlign: 'center', fontWeight: '700' },
    menuTitleRow: {
        backgroundColor: '#fff',
        paddingTop: 12,
        paddingBottom: 6,
        alignItems: 'center',
        flexGrow: 0,
        flexShrink: 0,
        alignSelf: 'stretch',
    },
    menuTitleRowWide: {
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        overflow: 'hidden',
        borderBottomWidth: 1,
        borderColor: '#eef2f7',
    },
    menuKicker: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    menuKickerDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#f59e0b',
    },
    menuKickerText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#b45309',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    menuTitle: { fontSize: 28, fontWeight: '900', color: '#111827', letterSpacing: -0.9, textAlign: 'center' },
    menuTitleRowCompact: {
        paddingTop: 6,
        paddingBottom: 0,
        borderBottomWidth: 1,
        borderColor: '#eef2f7',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 6,
    },
    menuTitleRowWideCompact: { paddingRight: 0 },
    menuTitleCompact: { fontSize: 20, marginBottom: 2 },
    menuList: {
        flex: 1,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 26,
        borderBottomRightRadius: 26,
    },
    listContent: { paddingBottom: 44, paddingTop: 14, flexGrow: 1 },
    gridRow: {
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        marginBottom: 16,
    },
    loadingIndicator: { marginTop: 60 },
    loadingWrap: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomLeftRadius: 26,
        borderBottomRightRadius: 26,
    },
    emptyContainer: { flex: 1, padding: 40, alignItems: 'center', justifyContent: 'center' },
    emptyText: { color: '#6b7280', fontSize: 16 },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 26,
        borderBottomRightRadius: 26,
    },
    errorContainerWide: {},
    errorText: { fontSize: 17, color: '#dc2626', textAlign: 'center', marginBottom: 24, lineHeight: 26 },
    retryBtn: { backgroundColor: '#dc2626', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14 },
    retryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    rightRail: {
        width: 288,
        gap: 14,
    },
    railCardStack: {
        width: 288,
        gap: 14,
    },
    diagCard: {
        position: 'absolute',
        top: -202,
        right: 0,
        backgroundColor: 'rgba(255,255,255,0.94)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        zIndex: 3,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.7)',
    },
    diagTitle: { color: '#7f1d1d', fontWeight: '800', fontSize: 11 },
    diagText: { color: '#7f1d1d', fontSize: 10, marginTop: 2 },
    railCard: {
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 20,
        shadowColor: '#0f172a',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#edf2f7',
    },
    railCardTitle: {
        color: '#1f2937',
        fontSize: 18,
        fontWeight: '900',
        marginBottom: 14,
        letterSpacing: -0.5,
    },
    railCardBody: {
        color: '#475569',
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 10,
    },
    railMutedText: {
        color: '#6b7280',
        fontSize: 13,
        marginTop: 6,
    },
    orderInfoChip: {
        alignSelf: 'flex-start',
        backgroundColor: '#dcfce7',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 10,
    },
    orderInfoChipText: { color: '#166534', fontWeight: '800', fontSize: 12 },
    railCancelBtn: {
        marginTop: 14,
        backgroundColor: '#dc2626',
        borderRadius: 14,
        paddingVertical: 13,
        alignItems: 'center',
    },
    railCancelBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    railInputLabel: {
        color: '#374151',
        fontWeight: '700',
        marginTop: 10,
        marginBottom: 8,
    },
    railInputBox: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 16,
        paddingVertical: 13,
        paddingHorizontal: 14,
        marginBottom: 14,
        backgroundColor: '#f8fafc',
    },
    railInputText: { color: '#111827', fontSize: 16 },
    railPrimaryBtn: {
        borderRadius: 18,
        paddingVertical: 15,
        alignItems: 'center',
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 5,
    },
    railHelpBtn: { backgroundColor: '#d97706' },
    railPrimaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    railFab: {
        alignSelf: 'flex-end',
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#ef1111',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#ef1111',
        shadowOpacity: 0.34,
        shadowRadius: 14,
        elevation: 10,
        marginTop: 2,
    },
    railFabText: { color: '#fff', fontSize: 18, fontWeight: '900' },
    chatFab: {
        position: 'absolute',
        right: 18,
        bottom: 24,
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: '#ef1111',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#ef1111',
        shadowOpacity: 0.34,
        shadowRadius: 14,
        elevation: 10,
    },
    chatFabText: { color: '#fff', fontSize: 18, fontWeight: '900' },
});

export default HomeScreen;
