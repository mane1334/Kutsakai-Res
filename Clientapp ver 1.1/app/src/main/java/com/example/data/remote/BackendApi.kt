package com.example.data.remote

import android.util.Log
import com.example.BuildConfig
import com.example.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

enum class WsConnectionStatus {
    CONNECTING,
    OPEN,
    CLOSED,
    ERROR
}

data class BackendOrderEvent(
    val type: String,
    val orderId: String,
    val tableNumber: String,
    val status: String,
    val message: String? = null
)

class BackendApi(
    host: String = BuildConfig.BACKEND_URL,
    private val restaurantId: String = BuildConfig.RESTAURANT_ID
) {
    @Volatile
    var baseUrl: String = normalizeBaseUrl(host)
        private set

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .pingInterval(20, TimeUnit.SECONDS)
        .build()

    private var socket: WebSocket? = null

    fun updateHost(newHost: String) {
        baseUrl = normalizeBaseUrl(newHost)
        Log.d("BackendApi", "Base URL updated to: $baseUrl")
    }

    fun resolveImageUrl(rawPath: String?): String? {
        if (rawPath.isNullOrBlank()) return null
        val trimmed = rawPath.trim()
        return when {
            trimmed.startsWith("http://") || trimmed.startsWith("https://") -> trimmed
            trimmed.startsWith("/") -> "$baseUrl$trimmed"
            else -> "$baseUrl/uploads/$trimmed"
        }
    }

    private fun request(path: String, method: String = "GET", body: String? = null): Request = Request.Builder()
        .url("$baseUrl/api/$path")
        .header("Accept", "application/json")
        .header("Content-Type", "application/json")
        .header("x-restaurant-id", restaurantId)
        .method(method, body?.toRequestBody(JSON) ?: if (method == "GET") null else "".toRequestBody(JSON))
        .build()

    suspend fun loadMenu(): Pair<List<Dish>, List<Category>> = withContext(Dispatchers.IO) {
        val menuJson = execute(request("menu"))
        val categoriesJson = execute(request("categories"))
        val categories = parseCategories(categoriesJson)
        val dishes = parseDishes(menuJson, categories)
        dishes to categories
    }

    suspend fun loadAds(): List<Advertisement> = withContext(Dispatchers.IO) {
        runCatching {
            val json = execute(request("ads"))
            parseAds(json)
        }.getOrElse { emptyList() }
    }

    suspend fun loadOrders(): List<Order> = withContext(Dispatchers.IO) {
        val root = JSONObject(execute(request("orders?limit=100&offset=0")))
        parseOrders(root.optJSONArray("orders") ?: JSONArray())
    }

    suspend fun loadWaiterCalls(): List<WaiterCall> = withContext(Dispatchers.IO) {
        runCatching {
            val json = execute(request("waiter-calls"))
            parseWaiterCalls(json)
        }.getOrElse { emptyList() }
    }

    suspend fun loadRatings(): List<RatingRecord> = withContext(Dispatchers.IO) {
        runCatching {
            val json = execute(request("ratings"))
            parseRatings(json)
        }.getOrElse { emptyList() }
    }

    suspend fun loadSettings(): Map<String, String> = withContext(Dispatchers.IO) {
        val root = JSONObject(execute(request("settings")))
        root.keys().asSequence().associateWith { root.optString(it) }
    }

    suspend fun chat(message: String, mode: String = "default"): String = withContext(Dispatchers.IO) {
        val payload = JSONObject().put("message", message).put("mode", mode)
        JSONObject(execute(request("chat", "POST", payload.toString()))).optString("reply")
    }

    suspend fun createOrder(table: String, items: List<CartItem>): Long = withContext(Dispatchers.IO) {
        val payload = JSONObject().apply {
            put("table_number", table)
            put("items", JSONArray().apply {
                items.forEach {
                    put(JSONObject().apply {
                        put("dish_id", it.dishId)
                        put("quantity", it.quantity)
                        if (it.notes.isNotBlank()) put("notes", it.notes)
                    })
                }
            })
        }
        val res = JSONObject(execute(request("orders", "POST", payload.toString())))
        res.optLong("order_id", res.optLong("id", 0L))
    }

    suspend fun updateSettings(settings: Map<String, String>) = withContext(Dispatchers.IO) {
        execute(request("settings", "PUT", JSONObject(settings).toString()))
    }

    suspend fun cancelOrder(id: String): Boolean = withContext(Dispatchers.IO) {
        execute(request("orders/$id/cancel", "POST"))
        true
    }

    suspend fun callWaiter(table: String, reason: String) = withContext(Dispatchers.IO) {
        val payload = JSONObject().put("table_number", table).put("reason", reason)
        execute(request("call-waiter", "POST", payload.toString()))
    }

    suspend fun submitRating(rating: RatingRecord, orderId: String? = null) = withContext(Dispatchers.IO) {
        val payload = JSONObject().apply {
            put("rating", rating.overallStars)
            put("comment", rating.comment)
            put("dish_id", rating.dishId ?: JSONObject.NULL)
            put("order_id", orderId ?: JSONObject.NULL)
        }
        execute(request("ratings", "POST", payload.toString()))
    }

    fun connect(
        onStatusChange: (WsConnectionStatus) -> Unit = {},
        onOrderEvent: (BackendOrderEvent) -> Unit
    ): WebSocket {
        socket?.cancel()
        val wsUrl = baseUrl.replaceFirst("https://", "wss://").replaceFirst("http://", "ws://")
        onStatusChange(WsConnectionStatus.CONNECTING)

        val req = Request.Builder().url(wsUrl).header("x-restaurant-id", restaurantId).build()
        socket = client.newWebSocket(req, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d("BackendApi", "WebSocket Conectado: $wsUrl")
                onStatusChange(WsConnectionStatus.OPEN)
                webSocket.send(JSONObject().put("type", "PING").toString())
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                runCatching {
                    val root = JSONObject(text)
                    val type = root.optString("type")
                    if (type == "PONG") return

                    if (type == "ORDER_STATUS_UPDATE" || type == "ORDER_COMPLETED" ||
                        type == "ORDER_CANCELLED" || type == "NEW_ORDER" ||
                        type == "PREP_TIME_UPDATE" || type == "COURTESY_MESSAGE" ||
                        type == "CALL_WAITER" || type == "WAITER_CALL_RESOLVED" ||
                        type == "MENU_UPDATED" || type == "ADS_UPDATED") {

                        val payload = root.optJSONObject("payload") ?: root
                        val orderId = payload.optString("id", payload.optString("order_id", ""))
                        val table = payload.optString("table_number", "")
                        val status = payload.optString("status", "")
                        val msg = payload.optString("message", "").ifBlank { null }

                        onOrderEvent(
                            BackendOrderEvent(
                                type = type,
                                orderId = orderId,
                                tableNumber = table,
                                status = status,
                                message = msg
                            )
                        )
                    }
                }.onFailure { Log.w("BackendApi", "Evento WebSocket inválido", it) }
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                onStatusChange(WsConnectionStatus.CLOSED)
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                onStatusChange(WsConnectionStatus.CLOSED)
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.w("BackendApi", "Falha WebSocket: ${t.message}")
                onStatusChange(WsConnectionStatus.ERROR)
            }
        })
        return socket!!
    }

    fun close() {
        socket?.close(1000, "app encerrado")
        socket = null
    }

    private fun execute(request: Request): String {
        client.newCall(request).execute().use { response ->
            val text = response.body?.string().orEmpty()
            if (!response.isSuccessful) {
                error("Backend ${response.code}: ${runCatching { JSONObject(text).optString("error") }.getOrDefault(text)}")
            }
            return text
        }
    }

    private fun parseOrders(array: JSONArray): List<Order> = (0 until array.length()).map { i ->
        val o = array.getJSONObject(i)
        val status = when (o.optString("status").lowercase()) {
            "pending", "received" -> OrderStatus.RECEIVED
            "preparing" -> OrderStatus.PREPARING
            "completed", "ready" -> OrderStatus.READY
            "delivered" -> OrderStatus.DELIVERED
            "cancelled" -> OrderStatus.CANCELLED
            else -> OrderStatus.RECEIVED
        }
        val items = o.optJSONArray("items")
        val summary = if (items == null) "Pedido" else (0 until items.length()).joinToString(", ") { j ->
            val item = items.getJSONObject(j)
            "${item.optInt("quantity")}x ${item.optString("name")}"
        }
        val prepTimeSeconds = o.optInt("prep_time_seconds", 1200)
        Order(
            orderId = o.optString("id", o.optString("order_id")),
            tableNumber = o.optString("table_number", "Mesa"),
            itemsSummary = summary,
            totalAmount = o.optDouble("total_price", 0.0),
            status = status,
            kitchenNotes = if (status == OrderStatus.READY) "Pedido pronto para entrega!" else "Em processamento pela cozinha",
            estimatedMinutesRemaining = (prepTimeSeconds / 60).coerceAtLeast(1)
        )
    }

    private fun parseCategories(json: String): List<Category> = JSONArray(json).let { array ->
        (0 until array.length()).map { i ->
            val o = array.getJSONObject(i)
            Category(
                id = o.optString("id"),
                namePt = o.optString("name", "Categoria"),
                nameEn = o.optString("name", "Category"),
                iconName = "restaurant",
                sortOrder = i
            )
        }
    }

    private fun parseDishes(json: String, categories: List<Category>): List<Dish> = JSONArray(json).let { array ->
        (0 until array.length()).map { i ->
            val o = array.getJSONObject(i)
            val categoryId = o.optString("category_id", categories.firstOrNull()?.id ?: "")
            val rawImage = o.optString("image_url").ifBlank { o.optString("image").ifBlank { o.optString("image_urls") } }
            val resolvedUrl = resolveImageUrl(rawImage)

            val tags = mutableListOf<DietaryTag>()
            if (o.optBoolean("is_spicy", false) || o.optInt("is_spicy", 0) == 1) tags.add(DietaryTag.SPICY)
            if (o.optBoolean("is_vegetarian", false) || o.optInt("is_vegetarian", 0) == 1) tags.add(DietaryTag.VEGETARIAN)
            if (o.optBoolean("is_gluten_free", false) || o.optInt("is_gluten_free", 0) == 1) tags.add(DietaryTag.GLUTEN_FREE)
            if (i < 3) tags.add(DietaryTag.CHEF_SPECIAL)

            Dish(
                id = o.optString("id"),
                name = o.optString("name"),
                nameEn = o.optString("name_en", o.optString("name")),
                description = o.optString("description", ""),
                descriptionEn = o.optString("description_en", o.optString("description", "")),
                price = o.optDouble("price", 0.0),
                categoryId = categoryId,
                drawableResName = "hero_restaurant_banner",
                prepTimeMinutes = o.optInt("preparation_time", o.optInt("prep_time_minutes", 15)),
                calories = o.optInt("calories", 0),
                rating = o.optDouble("rating", 5.0).coerceIn(1.0, 5.0),
                reviewCount = o.optInt("review_count", 0),
                tags = tags,
                isFeatured = i < 3,
                imageUrl = resolvedUrl
            )
        }
    }

    private fun parseAds(json: String): List<Advertisement> = JSONArray(json).let { array ->
        (0 until array.length()).map { i ->
            val o = array.getJSONObject(i)
            val rawImage = o.optString("image_url").ifBlank { o.optString("image") }
            Advertisement(
                id = o.optString("id", (i + 1).toString()),
                title = o.optString("title", "Promoção Especial"),
                content = o.optString("content", o.optString("description", "")),
                imageUrl = resolveImageUrl(rawImage),
                startDate = o.optString("start_date").ifBlank { null },
                endDate = o.optString("end_date").ifBlank { null },
                isActive = o.optBoolean("is_active", true) || o.optInt("is_active", 1) == 1,
                priority = o.optInt("priority", 0)
            )
        }
    }

    private fun parseWaiterCalls(json: String): List<WaiterCall> = JSONArray(json).let { array ->
        (0 until array.length()).map { i ->
            val o = array.getJSONObject(i)
            val reason = o.optString("reason", "Chamado Geral")
            val statusStr = o.optString("status", "pending").lowercase()
            val status = when (statusStr) {
                "resolved" -> WaiterCallStatus.RESOLVED
                "in_progress" -> WaiterCallStatus.IN_PROGRESS
                else -> WaiterCallStatus.PENDING
            }
            val type = when {
                reason.contains("conta", ignoreCase = true) || reason.contains("pagamento", ignoreCase = true) -> WaiterCallType.BILL
                reason.contains("cozinha", ignoreCase = true) -> WaiterCallType.KITCHEN
                reason.contains("limpeza", ignoreCase = true) -> WaiterCallType.CLEAN_TABLE
                reason.contains("gerente", ignoreCase = true) -> WaiterCallType.MANAGER
                else -> WaiterCallType.WAITER
            }
            WaiterCall(
                id = o.optLong("id", (i + 1).toLong()),
                type = type,
                description = reason,
                tableNumber = o.optString("table_number", "Mesa"),
                timestamp = System.currentTimeMillis() - (i * 60000),
                status = status
            )
        }
    }

    private fun parseRatings(json: String): List<RatingRecord> = JSONArray(json).let { array ->
        (0 until array.length()).map { i ->
            val o = array.getJSONObject(i)
            RatingRecord(
                id = o.optLong("id", (i + 1).toLong()),
                overallStars = o.optInt("rating", 5).coerceIn(1, 5),
                dishId = o.optString("dish_id").ifBlank { null },
                dishName = o.optString("dish_name").ifBlank { null },
                comment = o.optString("comment", ""),
                timestamp = System.currentTimeMillis() - (i * 120000)
            )
        }
    }

    companion object {
        private val JSON = "application/json".toMediaType()
        fun normalizeBaseUrl(host: String): String {
            val value = host.trim().removeSuffix("/")
            return if (value.startsWith("http://") || value.startsWith("https://")) value else "http://$value"
        }
    }
}
