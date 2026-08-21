package com.example.service

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class RestaurantFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "New Firebase Cloud Messaging token registered: $token")
        FcmManager.updateToken(applicationContext, token)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d(TAG, "FCM Message Received from: ${remoteMessage.from}")

        val data = remoteMessage.data
        val notification = remoteMessage.notification

        // Extract parameters from payload data or fallback to notification payload
        val orderId = data["order_id"] ?: data["orderId"] ?: "ORD-${System.currentTimeMillis() % 10000}"
        val tableNumber = data["table_number"] ?: data["tableNumber"] ?: "Mesa Atual"
        val statusStr = data["status"] ?: "READY"
        val itemsSummary = data["items_summary"] ?: data["items"] ?: "Pratos solicitados"
        val message = data["message"] ?: notification?.body ?: "Seu pedido está pronto!"

        Log.d(TAG, "Processing push update: Order $orderId -> Status: $statusStr for $tableNumber")

        FcmManager.handleIncomingOrderPush(
            context = applicationContext,
            orderId = orderId,
            tableNumber = tableNumber,
            statusStr = statusStr,
            itemsSummary = itemsSummary,
            customMessage = message
        )
    }

    companion object {
        private const val TAG = "RestaurantFcmService"
    }
}
