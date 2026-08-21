package com.example.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import com.example.MainActivity

object OrderNotificationHelper {

    const val CHANNEL_ID_ORDERS = "restaurant_orders_channel"
    const val NOTIFICATION_ID_ORDER_READY = 1001

    /**
     * Initializes the high-priority notification channel for order status updates.
     */
    fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Status dos Pedidos / Order Status"
            val descriptionText = "Notificações em tempo real sobre pratos prontos e atualizações da cozinha"
            val importance = NotificationManager.IMPORTANCE_HIGH

            val channel = NotificationChannel(CHANNEL_ID_ORDERS, name, importance).apply {
                description = descriptionText
                enableLights(true)
                lightColor = Color.rgb(109, 36, 48) // Bistro Wine color
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 150, 100, 200)
                setShowBadge(true)
                lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC

                val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                val audioAttributes = AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .build()
                setSound(defaultSoundUri, audioAttributes)
            }

            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    /**
     * Posts a heads-up system notification alerting the table that their order is Ready.
     */
    fun showOrderReadyNotification(
        context: Context,
        orderId: String,
        tableNumber: String,
        itemsSummary: String,
        kitchenMessage: String? = null
    ) {
        createNotificationChannel(context)

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("OPEN_TAB", "orders")
            putExtra("TARGET_ORDER_ID", orderId)
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            orderId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val title = "🍽️ Pedido Pronto! • $tableNumber"
        val body = kitchenMessage?.ifBlank { null }
            ?: "Seu pedido (#$orderId) foi finalizado pela cozinha e está a caminho da sua mesa!"

        val notificationBuilder = NotificationCompat.Builder(context, CHANNEL_ID_ORDERS)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .setBigContentTitle(title)
                    .bigText("$body\n\nItens: $itemsSummary")
            )
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setVibrate(longArrayOf(0, 150, 100, 200))
            .setColor(0xFF6D2430.toInt())
            .addAction(
                android.R.drawable.ic_menu_view,
                "Ver Detalhes",
                pendingIntent
            )

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(orderId.hashCode(), notificationBuilder.build())
    }
}
