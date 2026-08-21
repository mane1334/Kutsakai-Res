package com.example.service

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.example.data.local.RestaurantDatabase
import com.example.data.model.OrderStatus
import com.example.util.FeedbackManager
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class OrderReadyPushEvent(
    val orderId: String,
    val tableNumber: String,
    val status: OrderStatus,
    val itemsSummary: String,
    val message: String,
    val timestamp: Long = System.currentTimeMillis()
)

object FcmManager {
    private const val TAG = "FcmManager"
    private const val PREFS_NAME = "fcm_prefs"
    private const val KEY_FCM_TOKEN = "fcm_device_token"

    private val _fcmToken = MutableStateFlow<String?>(null)
    val fcmToken: StateFlow<String?> = _fcmToken.asStateFlow()

    private val _subscribedTopics = MutableStateFlow<Set<String>>(emptySet())
    val subscribedTopics: StateFlow<Set<String>> = _subscribedTopics.asStateFlow()

    private val _orderReadyEvents = MutableSharedFlow<OrderReadyPushEvent>(extraBufferCapacity = 10)
    val orderReadyEvents: SharedFlow<OrderReadyPushEvent> = _orderReadyEvents.asSharedFlow()

    private var currentTableTopic: String? = null

    fun initialize(context: Context, tableNumber: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val savedToken = prefs.getString(KEY_FCM_TOKEN, null)
        if (savedToken != null) {
            _fcmToken.value = savedToken
        }

        OrderNotificationHelper.createNotificationChannel(context)

        // Retrieve current FCM Registration Token
        try {
            FirebaseMessaging.getInstance().token
                .addOnCompleteListener { task ->
                    if (task.isSuccessful && task.result != null) {
                        val token = task.result
                        Log.d(TAG, "FCM Registration Token: $token")
                        updateToken(context, token)
                    } else {
                        Log.w(TAG, "Fetching FCM token failed", task.exception)
                    }
                }
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing Firebase Messaging: ${e.message}")
        }

        // Subscribe to global and table-specific topics
        subscribeToTableTopic(tableNumber)
        subscribeToTopic("restaurant_orders_all")
    }

    fun updateToken(context: Context, token: String) {
        _fcmToken.value = token
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_FCM_TOKEN, token).apply()
    }

    private fun sanitizeTopic(name: String): String {
        return name.lowercase()
            .replace("[^a-z0-9-_.~%]+".toRegex(), "_")
            .trim('_')
    }

    fun subscribeToTableTopic(tableNumber: String) {
        val newTopic = "table_" + sanitizeTopic(tableNumber)
        if (currentTableTopic == newTopic) return

        currentTableTopic?.let { oldTopic ->
            try {
                FirebaseMessaging.getInstance().unsubscribeFromTopic(oldTopic)
                _subscribedTopics.value = _subscribedTopics.value - oldTopic
                Log.d(TAG, "Unsubscribed from old table topic: $oldTopic")
            } catch (e: Exception) {
                Log.w(TAG, "Failed to unsubscribe from $oldTopic: ${e.message}")
            }
        }

        try {
            FirebaseMessaging.getInstance().subscribeToTopic(newTopic)
                .addOnSuccessListener {
                    currentTableTopic = newTopic
                    _subscribedTopics.value = _subscribedTopics.value + newTopic
                    Log.d(TAG, "Subscribed to table topic: $newTopic")
                }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to subscribe to $newTopic: ${e.message}")
        }
    }

    fun subscribeToTopic(topicName: String) {
        val safe = sanitizeTopic(topicName)
        try {
            FirebaseMessaging.getInstance().subscribeToTopic(safe)
                .addOnSuccessListener {
                    _subscribedTopics.value = _subscribedTopics.value + safe
                    Log.d(TAG, "Subscribed to topic: $safe")
                }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to subscribe to $safe: ${e.message}")
        }
    }

    /**
     * Dispatches an order status event from an incoming FCM push message.
     */
    fun handleIncomingOrderPush(
        context: Context,
        orderId: String,
        tableNumber: String,
        statusStr: String,
        itemsSummary: String,
        customMessage: String?
    ) {
        val status = try {
            OrderStatus.valueOf(statusStr.uppercase())
        } catch (_: Exception) {
            OrderStatus.READY
        }

        val message = customMessage?.ifBlank { null } ?: when (status) {
            OrderStatus.READY -> "Seu pedido está pronto para ser servido! O garçom está levando à sua mesa."
            OrderStatus.PREPARING -> "A cozinha começou a preparar o seu pedido!"
            OrderStatus.DELIVERED -> "Pedido entregue. Bom apetite!"
            else -> "Atualização no status do seu pedido."
        }

        val event = OrderReadyPushEvent(
            orderId = orderId,
            tableNumber = tableNumber,
            status = status,
            itemsSummary = itemsSummary,
            message = message
        )

        // 1. Emit to in-app event bus
        _orderReadyEvents.tryEmit(event)

        // 2. Play audible chime + haptics if status is READY
        if (status == OrderStatus.READY) {
            FeedbackManager.triggerOrderReadyFeedback(context)
            // 3. Show System Notification
            OrderNotificationHelper.showOrderReadyNotification(
                context = context,
                orderId = orderId,
                tableNumber = tableNumber,
                itemsSummary = itemsSummary,
                kitchenMessage = message
            )
        }

        // 4. Update Database
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val db = RestaurantDatabase.getDatabase(context, this)
                val existing = db.restaurantDao().getOrderById(orderId)
                if (existing != null) {
                    val remaining = if (status == OrderStatus.READY || status == OrderStatus.DELIVERED) 0 else 5
                    db.restaurantDao().updateOrder(
                        existing.copy(
                            status = status,
                            estimatedMinutesRemaining = remaining,
                            kitchenNotes = message
                        )
                    )
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to update order in database from push: ${e.message}")
            }
        }
    }

    /**
     * Simulates an incoming push message directly from the Admin / Kitchen testing controls.
     */
    fun simulateKitchenPush(
        context: Context,
        orderId: String,
        tableNumber: String,
        status: OrderStatus = OrderStatus.READY,
        itemsSummary: String = "2x Pratos Principais",
        message: String = "Prato finalizado pelo Chef! Garçom a caminho."
    ) {
        handleIncomingOrderPush(
            context = context,
            orderId = orderId,
            tableNumber = tableNumber,
            statusStr = status.name,
            itemsSummary = itemsSummary,
            customMessage = message
        )
    }
}
