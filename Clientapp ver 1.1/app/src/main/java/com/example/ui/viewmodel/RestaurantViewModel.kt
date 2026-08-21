package com.example.ui.viewmodel

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.local.RestaurantDatabase
import com.example.data.model.*
import com.example.data.remote.GeminiAiService
import com.example.data.remote.BackendApi
import com.example.service.BackendRealtimeManager
import com.example.data.repository.RestaurantRepository
import com.example.service.FcmManager
import com.example.service.OrderReadyPushEvent
import com.example.util.FeedbackManager
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

enum class NavigationTab(val route: String, val titlePt: String, val titleEn: String, val iconRes: String) {
    HOME("home", "Início", "Home", "home"),
    MENU("menu", "Cardápio", "Menu", "restaurant_menu"),
    CART("cart", "Carrinho", "Cart", "shopping_cart"),
    ORDERS("orders", "Status Pedido", "Order Status", "receipt_long"),
    AI_CHAT("ai_chat", "Chef IA", "AI Sommelier", "smart_toy"),
    WAITER_CALL("waiter_call", "Chamar Garçom", "Call Waiter", "room_service"),
    RATINGS("ratings", "Avaliações", "Reviews", "star_rate"),
    SETTINGS("settings", "Configurações", "Settings", "settings")
}

data class RestaurantUiState(
    val currentTab: NavigationTab = NavigationTab.HOME,
    val selectedTheme: AppThemeType = AppThemeType.LIGHT,
    val selectedLanguage: Language = Language.PT,
    val tableNumber: String = "Mesa 04",
    val restaurantName: String = "Interactive Gourmet Bistrô",
    val backendHost: String = "192.168.100.101:3000",
    val volume: Float = 0.8f,
    val brightness: Float = 0.9f,
    val selectedCategoryId: String? = null,
    val searchQuery: String = "",
    val activeDietaryFilters: Set<DietaryTag> = emptySet(),
    val selectedDishForDetail: Dish? = null,
    val isKioskScreensaverActive: Boolean = false,
    val isKioskModeEnabled: Boolean = true,
    val kioskTimeoutMinutes: Int = 15,
    val remainingKioskSeconds: Int = 15 * 60,
    val adminPin: String = "1234",
    val isPinPromptVisible: Boolean = false,
    val pinPromptTitle: String? = null,
    val isAdminUnlocked: Boolean = false,
    val fcmToken: String? = null,
    val subscribedTopics: Set<String> = emptySet(),
    val pendingOrderReadyEvent: OrderReadyPushEvent? = null,
    val wsStatus: com.example.data.remote.WsConnectionStatus = com.example.data.remote.WsConnectionStatus.CONNECTING,
    val courtesyMessage: String? = null,
    val chatMessages: List<ChatMessage> = listOf(
        ChatMessage(
            text = "Olá! Seja muito bem-vindo ao Interactive Restaurantes. Sou o Sommelier & Concierge IA. Posso sugerir pratos, harmonizações de vinhos e responder qualquer dúvida culinária!",
            isUser = false
        )
    ),
    val isAiThinking: Boolean = false,
    val isLoadingDishes: Boolean = true,
    val toastMessage: String? = null
)

class RestaurantViewModel(application: Application) : AndroidViewModel(application) {

    private val prefs = application.getSharedPreferences("terminal_settings", Context.MODE_PRIVATE)
    
    // 1. Initialize host from storage immediately
    private val initialHost = prefs.getString("backend_host", "192.168.100.101:3000") ?: "192.168.100.101:3000"
    
    // 2. Initialize API with correct host
    private val backendApi = BackendApi(host = initialHost)
    
    // 3. Initialize Database and Repository
    private val db = RestaurantDatabase.getDatabase(application, viewModelScope)
    private val repository = RestaurantRepository(db.restaurantDao(), GeminiAiService(), viewModelScope, backendApi)

    private val _uiState = MutableStateFlow(RestaurantUiState())
    val uiState: StateFlow<RestaurantUiState> = _uiState.asStateFlow()

    private val realtime = BackendRealtimeManager(
        application, 
        backendApi, 
        viewModelScope,
        tableProvider = { _uiState.value.tableNumber },
        onConnectionStatusChange = { status ->
            _uiState.update { it.copy(wsStatus = status) }
        },
        onCourtesyMessage = { msg ->
            _uiState.update { it.copy(courtesyMessage = msg) }
        },
        onOrderEvent = {
            repository.syncAll()
        }
    )

    private var pendingTabAfterPin: NavigationTab? = null

    val kioskService = com.example.util.KioskService(
        coroutineScope = viewModelScope,
        onInactivityTriggered = {
            _uiState.update { it.copy(isKioskScreensaverActive = true) }
        }
    )

    init {
        // Load other persisted settings into UI state
        val savedTable = prefs.getString("table_number", "Mesa 04") ?: "Mesa 04"
        val savedName = prefs.getString("restaurant_name", "Interactive Gourmet Bistrô") ?: "Interactive Gourmet Bistrô"
        val savedLang = prefs.getString("selected_language", "PT") ?: "PT"
        val savedTheme = prefs.getString("selected_theme", "LIGHT") ?: "LIGHT"
        
        _uiState.update { it.copy(
            backendHost = initialHost,
            tableNumber = savedTable,
            restaurantName = savedName,
            selectedLanguage = runCatching { Language.valueOf(savedLang) }.getOrDefault(Language.PT),
            selectedTheme = runCatching { AppThemeType.valueOf(savedTheme) }.getOrDefault(AppThemeType.LIGHT)
        ) }

        // Start realtime connection
        realtime.connect()
        
        viewModelScope.launch {
            runCatching { backendApi.loadSettings() }.onSuccess { settings ->
                _uiState.update { state -> state.copy(restaurantName = settings["restaurant_name"] ?: state.restaurantName) }
            }
        }

        // Initialize FCM
        FcmManager.initialize(application, _uiState.value.tableNumber)

        viewModelScope.launch {
            FcmManager.fcmToken.collect { token ->
                _uiState.update { it.copy(fcmToken = token) }
            }
        }

        viewModelScope.launch {
            FcmManager.subscribedTopics.collect { topics ->
                _uiState.update { it.copy(subscribedTopics = topics) }
            }
        }

        viewModelScope.launch {
            FcmManager.orderReadyEvents.collect { event ->
                if (event.status == OrderStatus.READY) {
                    _uiState.update {
                        it.copy(
                            pendingOrderReadyEvent = event,
                            isKioskScreensaverActive = false
                        )
                    }
                    kioskService.recordActivity()
                }
            }
        }

        viewModelScope.launch {
            kioskService.remainingSecondsToScreensaver.collect { remaining ->
                _uiState.update { it.copy(remainingKioskSeconds = remaining) }
            }
        }
        
        viewModelScope.launch {
            kotlinx.coroutines.delay(650)
            _uiState.update { it.copy(isLoadingDishes = false) }
        }
    }

    override fun onCleared() {
        realtime.close()
        super.onCleared()
    }

    fun dismissOrderReadyAlert() {
        _uiState.update { it.copy(pendingOrderReadyEvent = null) }
    }

    fun simulateKitchenPushNotification(
        orderId: String? = null,
        status: OrderStatus = OrderStatus.READY,
        message: String? = null
    ) {
        val active = activeOrder.value
        val targetId = orderId ?: active?.orderId ?: "ORD-${(1000..9999).random()}"
        val summary = active?.itemsSummary ?: "2x Pratos Principais, 1x Bebida"
        val customMsg = message ?: if (_uiState.value.selectedLanguage == Language.PT) {
            "O Chef finalizou seu pedido! O garçom está a caminho da sua mesa."
        } else {
            "Chef finished your order! The waiter is on their way to your table."
        }

        FcmManager.simulateKitchenPush(
            context = getApplication(),
            orderId = targetId,
            tableNumber = _uiState.value.tableNumber,
            status = status,
            itemsSummary = summary,
            message = customMsg
        )
    }

    fun refreshDishes() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoadingDishes = true) }
            repository.syncAll()
            _uiState.update { it.copy(isLoadingDishes = false) }
        }
    }

    val allDishes: StateFlow<List<Dish>> = repository.allDishes.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    val allCategories: StateFlow<List<Category>> = repository.allCategories.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    val allAds: StateFlow<List<Advertisement>> = repository.allAds.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    val cartItems: StateFlow<List<CartItem>> = repository.cartItems.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    val activeOrder: StateFlow<Order?> = repository.activeOrder.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )

    val allOrders: StateFlow<List<Order>> = repository.allOrders.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    val waiterCalls: StateFlow<List<WaiterCall>> = repository.waiterCalls.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    val ratings: StateFlow<List<RatingRecord>> = repository.ratings.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    val filteredDishes: StateFlow<List<Dish>> = combine(
        allDishes,
        _uiState
    ) { dishes, state ->
        dishes.filter { dish ->
            val matchesCategory = state.selectedCategoryId == null ||
                    (state.selectedCategoryId == "cat_destaques" && dish.isFeatured) ||
                    dish.categoryId == state.selectedCategoryId

            val matchesSearch = state.searchQuery.isBlank() ||
                    dish.name.contains(state.searchQuery, ignoreCase = true) ||
                    dish.nameEn.contains(state.searchQuery, ignoreCase = true) ||
                    dish.description.contains(state.searchQuery, ignoreCase = true)

            val matchesDietary = state.activeDietaryFilters.isEmpty() ||
                    state.activeDietaryFilters.all { dish.tags.contains(it) }

            matchesCategory && matchesSearch && matchesDietary
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    fun recordUserActivity() {
        kioskService.recordActivity()
    }

    fun navigateTo(tab: NavigationTab) {
        recordUserActivity()
        if (tab == NavigationTab.SETTINGS && !_uiState.value.isAdminUnlocked) {
            requestAdminPin(
                targetTab = NavigationTab.SETTINGS,
                title = if (_uiState.value.selectedLanguage == Language.PT) "Configurações Administrativas" else "Administrative Settings"
            )
            return
        }
        _uiState.update { it.copy(currentTab = tab, isKioskScreensaverActive = false) }
    }

    fun requestAdminPin(targetTab: NavigationTab? = null, title: String? = null) {
        pendingTabAfterPin = targetTab
        _uiState.update {
            it.copy(
                isPinPromptVisible = true,
                pinPromptTitle = title
            )
        }
    }

    fun onAdminPinVerified() {
        val target = pendingTabAfterPin
        pendingTabAfterPin = null
        _uiState.update {
            it.copy(
                isAdminUnlocked = true,
                isPinPromptVisible = false,
                isKioskScreensaverActive = false,
                currentTab = target ?: it.currentTab
            )
        }
        kioskService.dismissScreensaver()
        val msg = if (_uiState.value.selectedLanguage == Language.PT) "Acesso Administrativo Liberado" else "Admin Access Granted"
        showToast(msg)
    }

    fun dismissPinPrompt() {
        pendingTabAfterPin = null
        _uiState.update { it.copy(isPinPromptVisible = false) }
    }

    fun lockAdmin() {
        _uiState.update {
            it.copy(
                isAdminUnlocked = false,
                currentTab = NavigationTab.HOME
            )
        }
        val msg = if (_uiState.value.selectedLanguage == Language.PT) "Modo Terminal Bloqueado" else "Terminal Locked"
        showToast(msg)
    }

    fun setKioskModeEnabled(enabled: Boolean) {
        kioskService.setEnabled(enabled)
        _uiState.update { it.copy(isKioskModeEnabled = enabled) }
    }

    fun setKioskTimeoutMinutes(minutes: Int) {
        val validMinutes = minutes.coerceIn(1, 120)
        kioskService.setTimeoutMinutes(validMinutes)
        _uiState.update { it.copy(kioskTimeoutMinutes = validMinutes) }
    }

    fun setAdminPin(newPin: String) {
        if (newPin.length == 4 && newPin.all { it.isDigit() }) {
            _uiState.update { it.copy(adminPin = newPin) }
            val msg = if (_uiState.value.selectedLanguage == Language.PT) "Novo PIN salvo com sucesso!" else "New PIN saved successfully!"
            showToast(msg)
        }
    }

    fun setKioskScreensaver(active: Boolean) {
        if (active) {
            kioskService.triggerScreensaverManually()
        } else {
            kioskService.dismissScreensaver()
            _uiState.update { it.copy(isKioskScreensaverActive = false) }
        }
    }

    fun setTheme(theme: AppThemeType) {
        _uiState.update { it.copy(selectedTheme = theme) }
        prefs.edit().putString("selected_theme", theme.name).apply()
    }

    fun setLanguage(language: Language) {
        _uiState.update { it.copy(selectedLanguage = language) }
        prefs.edit().putString("selected_language", language.name).apply()
    }

    fun setTableNumber(table: String) {
        _uiState.update { it.copy(tableNumber = table) }
        prefs.edit().putString("table_number", table).apply()
        FcmManager.subscribeToTableTopic(table)
    }

    fun setRestaurantName(name: String) {
        _uiState.update { it.copy(restaurantName = name) }
        prefs.edit().putString("restaurant_name", name).apply()
    }

    fun setBackendHost(host: String) {
        _uiState.update { it.copy(backendHost = host) }
        prefs.edit().putString("backend_host", host).apply()
        backendApi.updateHost(host)
        realtime.connect()
        viewModelScope.launch {
            repository.syncAll()
        }
    }

    fun dismissCourtesyMessage() {
        _uiState.update { it.copy(courtesyMessage = null) }
    }

    fun setVolume(vol: Float) {
        _uiState.update { it.copy(volume = vol) }
    }

    fun setBrightness(bright: Float) {
        _uiState.update { it.copy(brightness = bright) }
    }

    fun selectCategory(categoryId: String?) {
        _uiState.update { it.copy(selectedCategoryId = categoryId) }
    }

    fun setSearchQuery(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun toggleDietaryFilter(tag: DietaryTag) {
        _uiState.update { current ->
            val updated = if (current.activeDietaryFilters.contains(tag)) {
                current.activeDietaryFilters - tag
            } else {
                current.activeDietaryFilters + tag
            }
            current.copy(activeDietaryFilters = updated)
        }
    }

    fun showDishDetail(dish: Dish?) {
        _uiState.update { it.copy(selectedDishForDetail = dish) }
    }

    fun addToCart(dish: Dish, quantity: Int = 1, notes: String = "") {
        viewModelScope.launch {
            repository.addToCart(dish, quantity, notes)
            FeedbackManager.triggerCartSuccessFeedback(getApplication(), _uiState.value.volume)
            val msg = if (_uiState.value.selectedLanguage == Language.PT) {
                "${dish.name} adicionado ao carrinho!"
            } else {
                "${dish.nameEn} added to cart!"
            }
            showToast(msg)
        }
    }

    fun updateCartQuantity(item: CartItem, newQty: Int) {
        viewModelScope.launch {
            repository.updateCartItemQuantity(item, newQty)
        }
    }

    fun removeCartItem(item: CartItem) {
        viewModelScope.launch {
            repository.removeCartItem(item)
        }
    }

    fun clearCart() {
        viewModelScope.launch {
            repository.clearCart()
        }
    }

    fun placeOrder() {
        viewModelScope.launch {
            val items = cartItems.value
            if (items.isNotEmpty()) {
                val order = repository.placeOrder(_uiState.value.tableNumber, items)
                val msg = if (_uiState.value.selectedLanguage == Language.PT) {
                    "Pedido #${order.orderId} enviado para a cozinha com sucesso!"
                } else {
                    "Order #${order.orderId} sent to the kitchen successfully!"
                }
                showToast(msg)
                navigateTo(NavigationTab.ORDERS)
            }
        }
    }

    fun cancelOrder(orderId: String) {
        viewModelScope.launch {
            val success = repository.cancelOrder(orderId)
            val msg = if (success) {
                if (_uiState.value.selectedLanguage == Language.PT) "Pedido cancelado com sucesso." else "Order cancelled."
            } else {
                if (_uiState.value.selectedLanguage == Language.PT) "Não é possível cancelar pedidos já em preparo." else "Cannot cancel orders already in preparation."
            }
            showToast(msg)
        }
    }

    fun callWaiter(type: WaiterCallType, description: String = "") {
        viewModelScope.launch {
            repository.callWaiter(type, description, _uiState.value.tableNumber)
            val msg = if (_uiState.value.selectedLanguage == Language.PT) {
                "Chamada para ${type.labelPt} registrada! Aguarde um instante."
            } else {
                "${type.labelEn} call dispatched! Please wait a moment."
            }
            showToast(msg)
        }
    }

    fun submitRating(stars: Int, comment: String, dishId: String? = null, dishName: String? = null) {
        viewModelScope.launch {
            repository.submitRating(
                RatingRecord(
                    overallStars = stars,
                    dishId = dishId,
                    dishName = dishName,
                    comment = comment
                )
            )
            val msg = if (_uiState.value.selectedLanguage == Language.PT) {
                "Obrigado pela sua avaliação! Sua opinião é fundamental."
            } else {
                "Thank you for your review! Your feedback is invaluable."
            }
            showToast(msg)
        }
    }

    fun sendAiMessage(userText: String) {
        if (userText.isBlank()) return
        val userMsg = ChatMessage(text = userText, isUser = true)
        _uiState.update {
            it.copy(
                chatMessages = it.chatMessages + userMsg,
                isAiThinking = true
            )
        }

        viewModelScope.launch {
            val response = repository.askAi(
                prompt = userText,
                isEnglish = _uiState.value.selectedLanguage == Language.EN
            )
            val aiMsg = ChatMessage(text = response, isUser = false)
            _uiState.update {
                it.copy(
                    chatMessages = it.chatMessages + aiMsg,
                    isAiThinking = false
                )
            }
        }
    }

    fun simulateVoiceInput() {
        val sampleVoicePromptsPt = listOf(
            "Qual vinho harmoniza melhor com o Salmão Grelhado?",
            "Vocês têm opções sem glúten no cardápio?",
            "Qual é o prato mais rápido para preparar?",
            "Qual a sobremesa mais recomendada pelo Chef?"
        )
        val sampleVoicePromptsEn = listOf(
            "Which wine pairs best with the Grilled Salmon?",
            "Do you have gluten-free options on the menu?",
            "What is the fastest dish to prepare?",
            "What is the most recommended dessert?"
        )

        val prompt = if (_uiState.value.selectedLanguage == Language.PT) {
            sampleVoicePromptsPt.random()
        } else {
            sampleVoicePromptsEn.random()
        }

        sendAiMessage(prompt)
    }

    fun showToast(message: String) {
        _uiState.update { it.copy(toastMessage = message) }
    }

    fun dismissToast() {
        _uiState.update { it.copy(toastMessage = null) }
    }
}
