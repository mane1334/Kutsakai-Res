package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.data.model.Language
import com.example.data.model.Order
import com.example.data.model.OrderStatus
import com.example.data.model.WaiterCallType
import com.example.ui.theme.StatusPreparing
import com.example.ui.theme.StatusReady
import com.example.ui.theme.StatusSuccess
import com.example.ui.viewmodel.NavigationTab
import com.example.ui.viewmodel.RestaurantUiState

@Composable
fun AppHeader(
    uiState: RestaurantUiState,
    activeOrder: Order?,
    cartItemCount: Int,
    onNavigate: (NavigationTab) -> Unit,
    onCallWaiter: (WaiterCallType) -> Unit,
    onToggleKiosk: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isPt = uiState.selectedLanguage == Language.PT

    Surface(
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 2.dp,
        modifier = modifier
            .fillMaxWidth()
            .border(
                width = 1.dp,
                color = MaterialTheme.colorScheme.outline.copy(alpha = 0.6f)
            )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Left: Restaurant branding & Table badge
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                modifier = Modifier.clickable { onNavigate(NavigationTab.HOME) }
            ) {
                Box(
                    modifier = Modifier
                        .size(42.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(MaterialTheme.colorScheme.primary),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "R",
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White
                        )
                    )
                }

                Column {
                    Text(
                        text = uiState.restaurantName.uppercase(),
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 15.sp,
                            letterSpacing = (-0.3).sp
                        ),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = if (isPt) "RESTAURANTE PREMIUM" else "PREMIUM RESTAURANT",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontSize = 10.sp,
                            letterSpacing = 1.5.sp,
                            fontWeight = FontWeight.SemiBold
                        ),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                // Table Pill Badge
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = MaterialTheme.colorScheme.primaryContainer,
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        MaterialTheme.colorScheme.outline
                    ),
                    modifier = Modifier.padding(start = 6.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.primary)
                        )
                        Text(
                            text = uiState.tableNumber,
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }

                // WebSocket Live Status Indicator Pill
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = when (uiState.wsStatus) {
                        com.example.data.remote.WsConnectionStatus.OPEN -> Color(0xFF10B981).copy(alpha = 0.15f)
                        com.example.data.remote.WsConnectionStatus.CONNECTING -> Color(0xFFF59E0B).copy(alpha = 0.15f)
                        else -> Color(0xFFEF4444).copy(alpha = 0.15f)
                    }
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp),
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(7.dp)
                                .clip(CircleShape)
                                .background(
                                    when (uiState.wsStatus) {
                                        com.example.data.remote.WsConnectionStatus.OPEN -> Color(0xFF10B981)
                                        com.example.data.remote.WsConnectionStatus.CONNECTING -> Color(0xFFF59E0B)
                                        else -> Color(0xFFEF4444)
                                    }
                                )
                        )
                        Text(
                            text = when (uiState.wsStatus) {
                                com.example.data.remote.WsConnectionStatus.OPEN -> "WS: ON"
                                com.example.data.remote.WsConnectionStatus.CONNECTING -> "WS: ..."
                                else -> "WS: OFF"
                            },
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 10.sp
                            ),
                            color = when (uiState.wsStatus) {
                                com.example.data.remote.WsConnectionStatus.OPEN -> Color(0xFF047857)
                                com.example.data.remote.WsConnectionStatus.CONNECTING -> Color(0xFFB45309)
                                else -> Color(0xFFB91C1C)
                            }
                        )
                    }
                }
            }

            // Center / Right actions: Active Order Pill, Call Waiter, Cart, Kiosk, Settings
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Active Order Badge if exists
                if (activeOrder != null && activeOrder.status != OrderStatus.DELIVERED && activeOrder.status != OrderStatus.CANCELLED) {
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = when (activeOrder.status) {
                            OrderStatus.RECEIVED -> MaterialTheme.colorScheme.primaryContainer
                            OrderStatus.PREPARING -> StatusPreparing.copy(alpha = 0.2f)
                            OrderStatus.READY -> StatusReady.copy(alpha = 0.2f)
                            else -> MaterialTheme.colorScheme.surfaceVariant
                        },
                        modifier = Modifier
                            .testTag("active_order_pill")
                            .clickable { onNavigate(NavigationTab.ORDERS) }
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                        ) {
                            Icon(
                                imageVector = when (activeOrder.status) {
                                    OrderStatus.RECEIVED -> Icons.Default.Receipt
                                    OrderStatus.PREPARING -> Icons.Default.SoupKitchen
                                    OrderStatus.READY -> Icons.Default.CheckCircle
                                    else -> Icons.Default.DeliveryDining
                                },
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(18.dp)
                            )
                            Text(
                                text = if (isPt) {
                                    "Pedido #${activeOrder.orderId}: ${activeOrder.status.labelPt} (~${activeOrder.estimatedMinutesRemaining}m)"
                                } else {
                                    "Order #${activeOrder.orderId}: ${activeOrder.status.labelEn} (~${activeOrder.estimatedMinutesRemaining}m)"
                                },
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }

                // Quick Call Waiter Button
                OutlinedButton(
                    onClick = { onCallWaiter(WaiterCallType.WAITER) },
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = MaterialTheme.colorScheme.primary
                    ),
                    modifier = Modifier.testTag("header_call_waiter_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.RoomService,
                        contentDescription = "Chamar Garçom",
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = if (isPt) "Chamar Garçom" else "Call Waiter",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold)
                    )
                }

                // Cart Button with Counter Badge
                Button(
                    onClick = { onNavigate(NavigationTab.CART) },
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary,
                        contentColor = MaterialTheme.colorScheme.onPrimary
                    ),
                    modifier = Modifier.testTag("header_cart_button")
                ) {
                    BadgedBox(
                        badge = {
                            if (cartItemCount > 0) {
                                Badge(
                                    containerColor = MaterialTheme.colorScheme.error,
                                    contentColor = Color.White
                                ) {
                                    Text(
                                        text = cartItemCount.toString(),
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Default.ShoppingCart,
                            contentDescription = "Carrinho",
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isPt) "Carrinho" else "Cart",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold)
                    )
                }

                // Kiosk Mode Screensaver Button
                IconButton(
                    onClick = onToggleKiosk,
                    modifier = Modifier
                        .size(42.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f))
                        .testTag("kiosk_mode_toggle_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Tv,
                        contentDescription = "Modo Kiosk / Screensaver",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(20.dp)
                    )
                }

                // Settings Button
                IconButton(
                    onClick = { onNavigate(NavigationTab.SETTINGS) },
                    modifier = Modifier
                        .size(42.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f))
                        .testTag("settings_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Settings,
                        contentDescription = "Configurações",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }
}
