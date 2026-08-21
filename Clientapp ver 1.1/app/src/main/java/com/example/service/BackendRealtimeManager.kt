package com.example.service

import android.content.Context
import com.example.data.remote.BackendApi
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/** Mantém o cliente ligado aos eventos operacionais publicados pelo backend. */
class BackendRealtimeManager(
    private val context: Context,
    private val api: BackendApi,
    private val scope: CoroutineScope,
    private val tableProvider: () -> String,
    private val onConnectionStatusChange: (com.example.data.remote.WsConnectionStatus) -> Unit = {},
    private val onCourtesyMessage: (String) -> Unit = {},
    private val onOrderEvent: suspend () -> Unit = {}
) {
    private var reconnectJob: Job? = null

    fun connect() {
        reconnectJob?.cancel()
        reconnectJob = scope.launch(Dispatchers.IO) {
            while (isActive) {
                api.connect(
                    onStatusChange = { status ->
                        onConnectionStatusChange(status)
                    },
                    onOrderEvent = { event ->
                        val isForTable = event.tableNumber.isBlank() || event.tableNumber.equals(tableProvider(), ignoreCase = true)

                        if (event.type == "COURTESY_MESSAGE" && event.message != null && isForTable) {
                            onCourtesyMessage(event.message)
                        }

                        val status = when (event.status.lowercase()) {
                            "pending", "received" -> "RECEIVED"
                            "preparing" -> "PREPARING"
                            "completed", "ready" -> "READY"
                            "delivered" -> "DELIVERED"
                            "cancelled" -> "CANCELLED"
                            else -> ""
                        }

                        if (isForTable && status.isNotBlank()) {
                            FcmManager.handleIncomingOrderPush(
                                context,
                                event.orderId,
                                event.tableNumber,
                                status,
                                "Pedido atualizado",
                                event.message
                            )
                        }

                        // Trigger sync for all relevant event types
                        scope.launch {
                            onOrderEvent()
                        }
                    }
                )
                // Keep connected or wait before reconnect cycle if disconnected
                delay(30_000)
            }
        }
    }

    fun close() {
        reconnectJob?.cancel()
        api.close()
    }
}
