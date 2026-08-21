package com.example.data.repository

import com.example.data.local.RestaurantDao
import com.example.data.local.SampleData
import com.example.data.model.*
import com.example.data.remote.GeminiAiService
import com.example.data.remote.BackendApi
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import java.util.UUID

class RestaurantRepository(
    private val dao: RestaurantDao,
    private val aiService: GeminiAiService,
    private val scope: CoroutineScope,
    private val backendApi: BackendApi = BackendApi()
) {
    val allDishes: Flow<List<Dish>> = dao.getAllDishes()
    val allCategories: Flow<List<Category>> = dao.getAllCategories()
    val allAds: Flow<List<Advertisement>> = dao.getActiveAds()
    val cartItems: Flow<List<CartItem>> = dao.getCartItems()
    val allOrders: Flow<List<Order>> = dao.getAllOrders()
    val activeOrder: Flow<Order?> = dao.getActiveOrder()
    val waiterCalls: Flow<List<WaiterCall>> = dao.getAllWaiterCalls()
    val ratings: Flow<List<RatingRecord>> = dao.getAllRatings()

    init {
        scope.launch(Dispatchers.IO) {
            syncAll()
        }
    }

    suspend fun syncAll() {
        syncMenu()
        syncAds()
        syncOrders()
        syncWaiterCalls()
        syncRatings()
    }

    suspend fun syncMenu() {
        runCatching { backendApi.loadMenu() }.onSuccess { (dishes, categories) ->
            if (categories.isNotEmpty()) {
                dao.insertCategories(categories)
            }
            if (dishes.isNotEmpty()) {
                dao.insertDishes(dishes)
            }
        }
    }

    suspend fun syncAds() {
        runCatching { backendApi.loadAds() }.onSuccess { ads ->
            if (ads.isNotEmpty()) {
                dao.insertAds(ads)
            }
        }
    }

    suspend fun syncOrders() {
        runCatching { backendApi.loadOrders() }.onSuccess { orders ->
            dao.clearOrders()
            orders.forEach { dao.insertOrder(it) }
        }
    }

    suspend fun syncWaiterCalls() {
        runCatching { backendApi.loadWaiterCalls() }.onSuccess { calls ->
            if (calls.isNotEmpty()) {
                dao.insertWaiterCalls(calls)
            }
        }
    }

    suspend fun syncRatings() {
        runCatching { backendApi.loadRatings() }.onSuccess { ratingsList ->
            if (ratingsList.isNotEmpty()) {
                dao.insertRatings(ratingsList)
            }
        }
    }

    suspend fun getDishById(id: String): Dish? = dao.getDishById(id)

    suspend fun addToCart(dish: Dish, quantity: Int = 1, notes: String = "") {
        val currentCart = dao.getCartItems().firstOrNull() ?: emptyList()
        val existing = currentCart.find { it.dishId == dish.id && it.notes == notes }
        if (existing != null) {
            dao.updateCartItem(existing.copy(quantity = existing.quantity + quantity))
        } else {
            dao.insertCartItem(
                CartItem(
                    dishId = dish.id,
                    dishName = dish.name,
                    dishNameEn = dish.nameEn,
                    unitPrice = dish.price,
                    quantity = quantity,
                    notes = notes,
                    drawableResName = dish.drawableResName,
                    imageUrl = dish.imageUrl
                )
            )
        }
    }

    suspend fun updateCartItemQuantity(item: CartItem, newQty: Int) {
        if (newQty <= 0) {
            dao.deleteCartItem(item)
        } else {
            dao.updateCartItem(item.copy(quantity = newQty))
        }
    }

    suspend fun removeCartItem(item: CartItem) {
        dao.deleteCartItem(item)
    }

    suspend fun clearCart() {
        dao.clearCart()
    }

    suspend fun placeOrder(tableNumber: String, items: List<CartItem>): Order {
        val orderId = backendApi.createOrder(tableNumber, items).toString()
        val total = items.sumOf { it.unitPrice * it.quantity }
        val summary = items.joinToString(", ") { "${it.quantity}x ${it.dishName}" }

        val order = Order(
            orderId = if (orderId.isNotBlank() && orderId != "0") orderId else "ORD-${(1000..9999).random()}",
            tableNumber = tableNumber,
            itemsSummary = summary,
            totalAmount = total,
            status = OrderStatus.RECEIVED,
            createdAtTimestamp = System.currentTimeMillis(),
            estimatedMinutesRemaining = 20,
            kitchenNotes = "Pedido enviado para a cozinha."
        )

        dao.insertOrder(order)
        dao.clearCart()
        runCatching { syncOrders() }

        return order
    }

    suspend fun cancelOrder(orderId: String): Boolean {
        val order = dao.getOrderById(orderId) ?: return false
        runCatching { backendApi.cancelOrder(orderId) }.getOrElse { return false }
        if (order.status == OrderStatus.RECEIVED) {
            dao.updateOrder(
                order.copy(
                    status = OrderStatus.CANCELLED,
                    estimatedMinutesRemaining = 0,
                    kitchenNotes = "Pedido cancelado pelo cliente."
                )
            )
            return true
        }
        return false
    }

    suspend fun callWaiter(type: WaiterCallType, description: String, tableNumber: String) {
        val reason = description.ifBlank { "Solicitação: ${type.labelPt}" }
        val call = WaiterCall(
            type = type,
            description = reason,
            tableNumber = tableNumber,
            timestamp = System.currentTimeMillis(),
            status = WaiterCallStatus.PENDING
        )
        dao.insertWaiterCall(call)

        scope.launch(Dispatchers.IO) {
            runCatching { backendApi.callWaiter(tableNumber, reason) }
            runCatching { syncWaiterCalls() }
        }
    }

    suspend fun submitRating(rating: RatingRecord) {
        dao.insertRating(rating)
        scope.launch(Dispatchers.IO) {
            runCatching { backendApi.submitRating(rating) }
            runCatching { syncRatings() }
        }
    }

    suspend fun askAi(prompt: String, isEnglish: Boolean): String {
        val dishes = dao.getAllDishes().firstOrNull() ?: SampleData.dishes
        return runCatching {
            backendApi.chat(prompt, if (isEnglish) "en" else "pt")
        }.getOrElse {
            aiService.sendMessage(prompt, dishes, isEnglish)
        }
    }
}
