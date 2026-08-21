package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.Language
import com.example.data.model.Order
import com.example.data.model.OrderStatus
import com.example.data.model.WaiterCallType
import com.example.ui.components.StatusTimeline
import com.example.ui.theme.StatusDanger
import com.example.ui.theme.StatusPreparing
import com.example.ui.theme.StatusReady
import com.example.ui.theme.StatusSuccess
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun OrderStatusScreen(
    activeOrder: Order?,
    allOrders: List<Order>,
    selectedLanguage: Language,
    onCancelOrder: (String) -> Unit,
    onCallWaiter: (WaiterCallType) -> Unit,
    onExploreMenu: () -> Unit,
    onSimulateKitchenReady: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val isPt = selectedLanguage == Language.PT
    val dateFormat = SimpleDateFormat("HH:mm", Locale.getDefault())

    BoxWithConstraints(
        modifier = modifier
            .fillMaxSize()
            .padding(24.dp)
    ) {
        val isWideTablet = maxWidth >= 850.dp

        if (isWideTablet && allOrders.isNotEmpty() && activeOrder != null) {
            // ===========================================
            // TABLET WIDE: SIDE-BY-SIDE 2 PANES
            // ===========================================
            Row(
                modifier = Modifier.fillMaxSize(),
                horizontalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                // Left: Active Order Progress & Actions
                Column(
                    modifier = Modifier
                        .weight(1.3f)
                        .fillMaxHeight()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    ActiveOrderCard(
                        activeOrder = activeOrder,
                        isPt = isPt,
                        dateFormat = dateFormat,
                        onCancelOrder = onCancelOrder,
                        onCallWaiter = onCallWaiter,
                        onSimulateKitchenReady = onSimulateKitchenReady
                    )
                }

                // Right: Past Orders History
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
                    ),
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Text(
                            text = if (isPt) "Histórico da Mesa" else "Table Order History",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.fillMaxSize()
                        ) {
                            items(allOrders) { order ->
                                PastOrderRow(order = order, isPt = isPt, dateFormat = dateFormat)
                            }
                        }
                    }
                }
            }
        } else {
            // ===========================================
            // TABLET PORTRAIT / STACKED VIEW
            // ===========================================
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                if (activeOrder != null && activeOrder.status != OrderStatus.CANCELLED) {
                    ActiveOrderCard(
                        activeOrder = activeOrder,
                        isPt = isPt,
                        dateFormat = dateFormat,
                        onCancelOrder = onCancelOrder,
                        onCallWaiter = onCallWaiter,
                        onSimulateKitchenReady = onSimulateKitchenReady
                    )
                } else {
                    // No active order banner
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircleOutline,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(40.dp)
                                )
                                Column {
                                    Text(
                                        text = if (isPt) "Nenhum pedido ativo no momento" else "No active order at the moment",
                                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                                    )
                                    Text(
                                        text = if (isPt) "Faça seu pedido pelo cardápio e acompanhe o preparo aqui." else "Place an order from the menu and track preparation live here.",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }

                            Button(
                                onClick = onExploreMenu,
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                            ) {
                                Text(if (isPt) "Abrir Cardápio" else "Open Menu", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                // Past Orders History
                if (allOrders.isNotEmpty()) {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = if (isPt) "Histórico de Pedidos da Mesa" else "Table Order History",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            allOrders.forEach { order ->
                                PastOrderRow(order = order, isPt = isPt, dateFormat = dateFormat)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ActiveOrderCard(
    activeOrder: Order,
    isPt: Boolean,
    dateFormat: SimpleDateFormat,
    onCancelOrder: (String) -> Unit,
    onCallWaiter: (WaiterCallType) -> Unit,
    onSimulateKitchenReady: (() -> Unit)?
) {
    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
        ),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("active_order_card")
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Header row: ID, Table, Status Pill
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = if (isPt) "Pedido em Andamento" else "Active Order in Progress",
                        style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Código #${activeOrder.orderId} • ${activeOrder.tableNumber} • ${dateFormat.format(Date(activeOrder.createdAtTimestamp))}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = when (activeOrder.status) {
                        OrderStatus.RECEIVED -> MaterialTheme.colorScheme.primaryContainer
                        OrderStatus.PREPARING -> StatusPreparing.copy(alpha = 0.2f)
                        OrderStatus.READY -> StatusReady.copy(alpha = 0.2f)
                        OrderStatus.DELIVERED -> StatusSuccess.copy(alpha = 0.2f)
                        else -> MaterialTheme.colorScheme.surfaceVariant
                    }
                ) {
                    Text(
                        text = if (isPt) activeOrder.status.labelPt else activeOrder.status.labelEn,
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = when (activeOrder.status) {
                                OrderStatus.PREPARING -> StatusPreparing
                                OrderStatus.READY -> StatusReady
                                OrderStatus.DELIVERED -> StatusSuccess
                                else -> MaterialTheme.colorScheme.primary
                            }
                        ),
                        modifier = Modifier.padding(horizontal = 18.dp, vertical = 8.dp)
                    )
                }
            }

            // Interactive Animated Timeline
            StatusTimeline(
                currentStatus = activeOrder.status,
                isEnglish = !isPt,
                modifier = Modifier.padding(vertical = 12.dp)
            )

            // Estimated Time Remaining Banner
            if (activeOrder.status != OrderStatus.DELIVERED) {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.primary),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.HourglassTop,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onPrimary
                            )
                        }

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = if (isPt) "Tempo estimado restante: ~${activeOrder.estimatedMinutesRemaining} minutos" else "Estimated time remaining: ~${activeOrder.estimatedMinutesRemaining} mins",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = activeOrder.kitchenNotes,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            // Items Summary & Total
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = if (isPt) "Itens Solicitados:" else "Ordered Dishes:",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = activeOrder.itemsSummary,
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }

                Text(
                    text = "Total: MT ${String.format("%.2f", activeOrder.totalAmount)}",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.ExtraBold,
                        color = MaterialTheme.colorScheme.primary
                    )
                )
            }

            // Action buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (activeOrder.status == OrderStatus.RECEIVED) {
                    OutlinedButton(
                        onClick = { onCancelOrder(activeOrder.orderId) },
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = StatusDanger
                        ),
                        modifier = Modifier.testTag("cancel_order_button")
                    ) {
                        Icon(imageVector = Icons.Default.Cancel, contentDescription = null, tint = StatusDanger)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(if (isPt) "Cancelar Pedido" else "Cancel Order", fontWeight = FontWeight.Bold)
                    }
                }

                Button(
                    onClick = { onCallWaiter(WaiterCallType.WAITER) },
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    Icon(imageVector = Icons.Default.RoomService, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(if (isPt) "Chamar Garçom" else "Call Waiter", fontWeight = FontWeight.Bold)
                }

                if (onSimulateKitchenReady != null && activeOrder.status != OrderStatus.READY && activeOrder.status != OrderStatus.DELIVERED) {
                    FilledTonalButton(
                        onClick = onSimulateKitchenReady,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.testTag("simulate_order_ready_fcm_btn")
                    ) {
                        Icon(imageVector = Icons.Default.NotificationsActive, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(if (isPt) "Simular Notificação FCM (Pronto)" else "Simulate Kitchen Push (Ready)")
                    }
                }
            }
        }
    }
}

@Composable
private fun PastOrderRow(order: Order, isPt: Boolean, dateFormat: SimpleDateFormat) {
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Pedido #${order.orderId} • ${dateFormat.format(Date(order.createdAtTimestamp))}",
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = order.itemsSummary,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1
                )
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "MT ${String.format("%.2f", order.totalAmount)}",
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                )

                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = when (order.status) {
                        OrderStatus.DELIVERED -> StatusSuccess.copy(alpha = 0.15f)
                        OrderStatus.CANCELLED -> StatusDanger.copy(alpha = 0.15f)
                        else -> MaterialTheme.colorScheme.primaryContainer
                    }
                ) {
                    Text(
                        text = if (isPt) order.status.labelPt else order.status.labelEn,
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = when (order.status) {
                            OrderStatus.DELIVERED -> StatusSuccess
                            OrderStatus.CANCELLED -> StatusDanger
                            else -> MaterialTheme.colorScheme.primary
                        },
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }
        }
    }
}
