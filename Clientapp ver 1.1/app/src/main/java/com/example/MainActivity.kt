package com.example

import android.Manifest
import android.content.Intent
import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.animation.*
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.model.Dish
import com.example.data.model.Language
import com.example.ui.components.AdminPinDialog
import com.example.ui.components.AppHeader
import com.example.ui.components.AppNavigationBar
import com.example.ui.components.AppNavigationRail
import com.example.ui.components.KioskScreensaver
import com.example.ui.components.OrderReadyDialog
import com.example.ui.screens.*
import com.example.ui.theme.InteractiveRestaurantesTheme
import com.example.ui.viewmodel.NavigationTab
import com.example.ui.viewmodel.RestaurantViewModel

class MainActivity : ComponentActivity() {
    private val viewModel: RestaurantViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        applyTabletOrientationLock()
        enableEdgeToEdge()
        handleIntent(intent)

        setContent {
            val uiState by viewModel.uiState.collectAsStateWithLifecycle()
            val allDishes by viewModel.allDishes.collectAsStateWithLifecycle()
            val filteredDishes by viewModel.filteredDishes.collectAsStateWithLifecycle()
            val categories by viewModel.allCategories.collectAsStateWithLifecycle()
            val cartItems by viewModel.cartItems.collectAsStateWithLifecycle()
            val activeOrder by viewModel.activeOrder.collectAsStateWithLifecycle()
            val allOrders by viewModel.allOrders.collectAsStateWithLifecycle()
            val waiterCalls by viewModel.waiterCalls.collectAsStateWithLifecycle()
            val ratings by viewModel.ratings.collectAsStateWithLifecycle()
            val allAds by viewModel.allAds.collectAsStateWithLifecycle()

            val snackbarHostState = remember { SnackbarHostState() }

            // Request Notification Permission on Android 13+
            val notificationPermissionLauncher = rememberLauncherForActivityResult(
                contract = ActivityResultContracts.RequestPermission()
            ) { isGranted ->
                if (!isGranted) {
                    viewModel.showToast(
                        if (uiState.selectedLanguage == Language.PT)
                            "Ative as notificações para receber avisos da cozinha em tempo real."
                        else
                            "Enable notifications for real-time kitchen alerts."
                    )
                }
            }

            LaunchedEffect(Unit) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
            }

            // Show Toast / Snackbar when message changes
            LaunchedEffect(uiState.toastMessage) {
                uiState.toastMessage?.let { msg ->
                    snackbarHostState.showSnackbar(
                        message = msg,
                        duration = SnackbarDuration.Short
                    )
                    viewModel.dismissToast()
                }
            }

            InteractiveRestaurantesTheme(themeType = uiState.selectedTheme) {
                val totalCartCount = cartItems.sumOf { it.quantity }
                val activeOrderCount = if (activeOrder != null) 1 else 0

                BoxWithConstraints(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(MaterialTheme.colorScheme.background)
                        .pointerInput(Unit) {
                            awaitPointerEventScope {
                                while (true) {
                                    awaitPointerEvent(pass = PointerEventPass.Initial)
                                    viewModel.recordUserActivity()
                                }
                            }
                        }
                ) {
                    val isTabletLandscape = maxWidth >= 720.dp

                    Scaffold(
                        snackbarHost = { SnackbarHost(snackbarHostState) },
                        contentWindowInsets = WindowInsets.systemBars,
                        topBar = {
                            AppHeader(
                                uiState = uiState,
                                activeOrder = activeOrder,
                                cartItemCount = totalCartCount,
                                onNavigate = { viewModel.navigateTo(it) },
                                onCallWaiter = { viewModel.callWaiter(it) },
                                onToggleKiosk = { viewModel.setKioskScreensaver(true) }
                            )
                        },
                        bottomBar = {
                            if (!isTabletLandscape) {
                                AppNavigationBar(
                                    currentTab = uiState.currentTab,
                                    selectedLanguage = uiState.selectedLanguage,
                                    cartItemCount = totalCartCount,
                                    activeOrderCount = activeOrderCount,
                                    onTabSelected = { viewModel.navigateTo(it) }
                                )
                            }
                        }
                    ) { innerPadding ->
                        Row(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(innerPadding)
                        ) {
                            if (isTabletLandscape) {
                                // Left Tablet Navigation Rail
                                AppNavigationRail(
                                    currentTab = uiState.currentTab,
                                    selectedLanguage = uiState.selectedLanguage,
                                    cartItemCount = totalCartCount,
                                    activeOrderCount = activeOrderCount,
                                    onTabSelected = { viewModel.navigateTo(it) }
                                )
                            }

                            // Main Content Area with sleek entrance animation (300ms fade-in + 20px Y translate)
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                            ) {
                                AnimatedContent(
                                    targetState = uiState.currentTab,
                                    transitionSpec = {
                                        (fadeIn(animationSpec = tween(durationMillis = 300, easing = FastOutSlowInEasing)) +
                                         slideInVertically(
                                             animationSpec = tween(durationMillis = 300, easing = FastOutSlowInEasing),
                                             initialOffsetY = { 20 }
                                         )).togetherWith(
                                             fadeOut(animationSpec = tween(durationMillis = 200, easing = FastOutSlowInEasing))
                                         )
                                    },
                                    label = "screen_transition"
                                ) { tab ->
                                    when (tab) {
                                        NavigationTab.HOME -> {
                                            HomeScreen(
                                                featuredDishes = allDishes.filter { it.isFeatured },
                                                categories = categories,
                                                advertisements = allAds,
                                                selectedLanguage = uiState.selectedLanguage,
                                                onNavigate = { viewModel.navigateTo(it) },
                                                onSelectCategory = { viewModel.selectCategory(it) },
                                                onDishClick = { viewModel.showDishDetail(it) },
                                                onQuickAdd = { viewModel.addToCart(it, 1) },
                                                isLoading = uiState.isLoadingDishes
                                            )
                                        }
                                        NavigationTab.MENU -> {
                                            MenuScreen(
                                                dishes = filteredDishes,
                                                categories = categories,
                                                selectedCategoryId = uiState.selectedCategoryId,
                                                searchQuery = uiState.searchQuery,
                                                activeDietaryFilters = uiState.activeDietaryFilters,
                                                selectedLanguage = uiState.selectedLanguage,
                                                onSelectCategory = { viewModel.selectCategory(it) },
                                                onSearchQueryChange = { viewModel.setSearchQuery(it) },
                                                onToggleDietaryFilter = { viewModel.toggleDietaryFilter(it) },
                                                onDishClick = { viewModel.showDishDetail(it) },
                                                onQuickAdd = { viewModel.addToCart(it, 1) },
                                                isLoading = uiState.isLoadingDishes,
                                                onRefresh = { viewModel.refreshDishes() }
                                            )
                                        }
                                        NavigationTab.CART -> {
                                            CartScreen(
                                                cartItems = cartItems,
                                                tableNumber = uiState.tableNumber,
                                                selectedLanguage = uiState.selectedLanguage,
                                                onUpdateQuantity = { item, qty -> viewModel.updateCartQuantity(item, qty) },
                                                onRemoveItem = { viewModel.removeCartItem(it) },
                                                onClearCart = { viewModel.clearCart() },
                                                onPlaceOrder = { viewModel.placeOrder() },
                                                onExploreMenu = { viewModel.navigateTo(NavigationTab.MENU) }
                                            )
                                        }
                                        NavigationTab.ORDERS -> {
                                            OrderStatusScreen(
                                                activeOrder = activeOrder,
                                                allOrders = allOrders,
                                                selectedLanguage = uiState.selectedLanguage,
                                                onCancelOrder = { viewModel.cancelOrder(it) },
                                                onCallWaiter = { viewModel.callWaiter(it) },
                                                onExploreMenu = { viewModel.navigateTo(NavigationTab.MENU) },
                                                onSimulateKitchenReady = { viewModel.simulateKitchenPushNotification() }
                                            )
                                        }
                                        NavigationTab.AI_CHAT -> {
                                            ChatAiScreen(
                                                messages = uiState.chatMessages,
                                                isThinking = uiState.isAiThinking,
                                                selectedLanguage = uiState.selectedLanguage,
                                                onSendMessage = { viewModel.sendAiMessage(it) },
                                                onSimulateVoice = { viewModel.simulateVoiceInput() }
                                            )
                                        }
                                        NavigationTab.WAITER_CALL -> {
                                            WaiterCallScreen(
                                                tableNumber = uiState.tableNumber,
                                                waiterCalls = waiterCalls,
                                                selectedLanguage = uiState.selectedLanguage,
                                                onCallWaiter = { type, desc -> viewModel.callWaiter(type, desc) }
                                            )
                                        }
                                        NavigationTab.RATINGS -> {
                                            RatingsScreen(
                                                dishes = allDishes,
                                                ratings = ratings,
                                                selectedLanguage = uiState.selectedLanguage,
                                                onSubmitRating = { stars, comment, dishId, dishName ->
                                                    viewModel.submitRating(stars, comment, dishId, dishName)
                                                }
                                            )
                                        }
                                        NavigationTab.SETTINGS -> {
                                            SettingsScreen(
                                                uiState = uiState,
                                                onSetTheme = { viewModel.setTheme(it) },
                                                onSetLanguage = { viewModel.setLanguage(it) },
                                                onSetTableNumber = { viewModel.setTableNumber(it) },
                                                onSetRestaurantName = { viewModel.setRestaurantName(it) },
                                                onSetBackendHost = { viewModel.setBackendHost(it) },
                                                onSetVolume = { viewModel.setVolume(it) },
                                                onSetBrightness = { viewModel.setBrightness(it) },
                                                onSetKioskModeEnabled = { viewModel.setKioskModeEnabled(it) },
                                                onSetKioskTimeout = { viewModel.setKioskTimeoutMinutes(it) },
                                                onSetAdminPin = { viewModel.setAdminPin(it) },
                                                onLockAdmin = { viewModel.lockAdmin() },
                                                onActivateScreensaver = { viewModel.setKioskScreensaver(true) },
                                                onSimulateKitchenNotification = {
                                                    viewModel.simulateKitchenPushNotification()
                                                }
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Dish Detail Zoom Dialog
                    uiState.selectedDishForDetail?.let { dish ->
                        DishDetailDialog(
                            dish = dish,
                            selectedLanguage = uiState.selectedLanguage,
                            onDismiss = { viewModel.showDishDetail(null) },
                            onAddToCart = { d, qty, notes ->
                                viewModel.addToCart(d, qty, notes)
                            }
                        )
                    }

                    // Admin PIN Verification Dialog
                    if (uiState.isPinPromptVisible) {
                        AdminPinDialog(
                            correctPin = uiState.adminPin,
                            selectedLanguage = uiState.selectedLanguage,
                            customTitle = uiState.pinPromptTitle,
                            onSuccess = { viewModel.onAdminPinVerified() },
                            onDismiss = { viewModel.dismissPinPrompt() }
                        )
                    }

                    // In-App FCM Order Ready Notification Dialog
                    uiState.pendingOrderReadyEvent?.let { readyEvent ->
                        OrderReadyDialog(
                            event = readyEvent,
                            selectedLanguage = uiState.selectedLanguage,
                            onViewOrder = {
                                viewModel.dismissOrderReadyAlert()
                                viewModel.navigateTo(NavigationTab.ORDERS)
                            },
                            onDismiss = { viewModel.dismissOrderReadyAlert() }
                        )
                    }

                    // Courtesy Message from Staff/Kitchen Dialog
                    uiState.courtesyMessage?.let { msg ->
                        AlertDialog(
                            onDismissRequest = { viewModel.dismissCourtesyMessage() },
                            title = {
                                Text(
                                    text = if (uiState.selectedLanguage == Language.PT) "Mensagem do Restaurante" else "Message from Restaurant",
                                    fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                                )
                            },
                            text = { Text(text = msg) },
                            confirmButton = {
                                TextButton(onClick = { viewModel.dismissCourtesyMessage() }) {
                                    Text("OK")
                                }
                            }
                        )
                    }

                    // Fullscreen Ambient Screensaver (Kiosk Mode with Ads & Chef Specials)
                    AnimatedVisibility(
                        visible = uiState.isKioskScreensaverActive,
                        enter = fadeIn(),
                        exit = fadeOut()
                    ) {
                        KioskScreensaver(
                            featuredDishes = allDishes.filter { it.isFeatured },
                            advertisements = allAds,
                            restaurantName = uiState.restaurantName,
                            tableNumber = uiState.tableNumber,
                            selectedLanguage = uiState.selectedLanguage,
                            onDismiss = { viewModel.setKioskScreensaver(false) },
                            onAdminUnlock = {
                                viewModel.requestAdminPin(
                                    targetTab = NavigationTab.SETTINGS,
                                    title = if (uiState.selectedLanguage == Language.PT) "Desbloquear Configurações" else "Unlock Settings"
                                )
                            }
                        )
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        applyTabletOrientationLock()
    }

    /**
     * Enforces locked landscape mode specifically for tablet form factors (7" to 13"+ devices),
     * ensuring a consistent widescreen interactive dining and kiosk layout across all restaurant tables.
     * Uses SCREEN_ORIENTATION_SENSOR_LANDSCAPE so tablets can rotate seamlessly 180 degrees
     * based on table mounting stands and charging dock orientations.
     */
    private fun applyTabletOrientationLock() {
        if (isTabletDevice()) {
            requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
        }
    }

    /**
     * Determines whether the current device is a tablet form factor.
     * Checks both smallestScreenWidthDp (>= 600dp represents standard 7" to 13" Android tablets)
     * and screen layout size qualifiers (SCREENLAYOUT_SIZE_LARGE / SCREENLAYOUT_SIZE_XLARGE).
     */
    private fun isTabletDevice(): Boolean {
        val configuration = resources.configuration
        val smallestWidthDp = configuration.smallestScreenWidthDp
        val isLargeScreen = (configuration.screenLayout and Configuration.SCREENLAYOUT_SIZE_MASK) >= Configuration.SCREENLAYOUT_SIZE_LARGE
        return smallestWidthDp >= 600 || isLargeScreen
    }

    private fun handleIntent(intent: Intent?) {
        intent?.getStringExtra("OPEN_TAB")?.let { tabStr ->
            if (tabStr.equals("orders", ignoreCase = true)) {
                viewModel.navigateTo(NavigationTab.ORDERS)
            }
        }
    }
}
