package com.example.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.data.model.CartItem
import com.example.data.model.Language
import com.example.ui.components.QuantitySelector

@Composable
fun CartScreen(
    cartItems: List<CartItem>,
    tableNumber: String,
    selectedLanguage: Language,
    onUpdateQuantity: (CartItem, Int) -> Unit,
    onRemoveItem: (CartItem) -> Unit,
    onClearCart: () -> Unit,
    onPlaceOrder: () -> Unit,
    onExploreMenu: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isPt = selectedLanguage == Language.PT
    val context = LocalContext.current
    var includeServiceFee by remember { mutableStateOf(true) }

    val subtotal = cartItems.sumOf { it.unitPrice * it.quantity }
    val serviceFee = if (includeServiceFee) subtotal * 0.10 else 0.0
    val total = subtotal + serviceFee

    if (cartItems.isEmpty()) {
        // Empty Cart State
        Box(
            modifier = modifier
                .fillMaxSize()
                .padding(24.dp)
                .testTag("empty_cart_view"),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.widthIn(max = 450.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(24.dp),
                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f),
                    modifier = Modifier.size(100.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.RemoveShoppingCart,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(48.dp)
                        )
                    }
                }

                Text(
                    text = if (isPt) "Seu carrinho está vazio" else "Your cart is empty",
                    style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface
                )

                Text(
                    text = if (isPt) "Navegue pelo nosso cardápio e adicione pratos refinados, vinhos e sobremesas." else "Browse our menu and add fine dishes, wine pairings, and desserts.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )

                Spacer(modifier = Modifier.height(8.dp))

                Button(
                    onClick = onExploreMenu,
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    contentPadding = PaddingValues(horizontal = 28.dp, vertical = 14.dp),
                    modifier = Modifier.testTag("explore_menu_empty_cart_btn")
                ) {
                    Icon(imageVector = Icons.Default.RestaurantMenu, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isPt) "Explorar Cardápio" else "Explore Menu",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                }
            }
        }
    } else {
        BoxWithConstraints(
            modifier = modifier
                .fillMaxSize()
                .padding(24.dp)
        ) {
            val isWideTablet = maxWidth >= 720.dp

            if (isWideTablet) {
                // =====================================
                // TABLET WIDE: SIDE-BY-SIDE 2 COLUMNS
                // =====================================
                Row(
                    modifier = Modifier.fillMaxSize(),
                    horizontalArrangement = Arrangement.spacedBy(24.dp)
                ) {
                    // Left Column: Items list (Scrollable)
                    Column(
                        modifier = Modifier
                            .weight(1.4f)
                            .fillMaxHeight(),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = if (isPt) "Itens no Carrinho (${cartItems.size})" else "Cart Items (${cartItems.size})",
                                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurface
                            )

                            TextButton(onClick = onClearCart) {
                                Icon(imageVector = Icons.Default.DeleteSweep, contentDescription = null, tint = MaterialTheme.colorScheme.error)
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(if (isPt) "Esvaziar Carrinho" else "Clear Cart", color = MaterialTheme.colorScheme.error)
                            }
                        }

                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .weight(1f)
                                .testTag("cart_items_list")
                        ) {
                            items(cartItems, key = { it.localId }) { item ->
                                CartItemCard(
                                    item = item,
                                    isPt = isPt,
                                    context = context,
                                    onUpdateQuantity = onUpdateQuantity,
                                    onRemoveItem = onRemoveItem
                                )
                            }
                        }
                    }

                    // Right Column: Order Summary Card
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
                        OrderSummaryContent(
                            isPt = isPt,
                            tableNumber = tableNumber,
                            subtotal = subtotal,
                            includeServiceFee = includeServiceFee,
                            onToggleServiceFee = { includeServiceFee = it },
                            serviceFee = serviceFee,
                            total = total,
                            onPlaceOrder = onPlaceOrder
                        )
                    }
                }
            } else {
                // =====================================
                // TABLET PORTRAIT / COMPACT: VERTICAL
                // =====================================
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(20.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = if (isPt) "Itens no Carrinho (${cartItems.size})" else "Cart Items (${cartItems.size})",
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        TextButton(onClick = onClearCart) {
                            Icon(imageVector = Icons.Default.DeleteSweep, contentDescription = null, tint = MaterialTheme.colorScheme.error)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(if (isPt) "Esvaziar" else "Clear", color = MaterialTheme.colorScheme.error)
                        }
                    }

                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        cartItems.forEach { item ->
                            CartItemCard(
                                item = item,
                                isPt = isPt,
                                context = context,
                                onUpdateQuantity = onUpdateQuantity,
                                onRemoveItem = onRemoveItem
                            )
                        }
                    }

                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        OrderSummaryContent(
                            isPt = isPt,
                            tableNumber = tableNumber,
                            subtotal = subtotal,
                            includeServiceFee = includeServiceFee,
                            onToggleServiceFee = { includeServiceFee = it },
                            serviceFee = serviceFee,
                            total = total,
                            onPlaceOrder = onPlaceOrder
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CartItemCard(
    item: CartItem,
    isPt: Boolean,
    context: android.content.Context,
    onUpdateQuantity: (CartItem, Int) -> Unit,
    onRemoveItem: (CartItem) -> Unit
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
        ),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("cart_item_${item.dishId}")
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            com.example.ui.components.DishImage(
                imageUrl = item.imageUrl,
                drawableResName = item.drawableResName,
                contentDescription = item.dishName,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .size(80.dp)
                    .clip(RoundedCornerShape(12.dp))
            )

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = if (isPt) item.dishName else item.dishNameEn,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface
                )

                if (item.notes.isNotBlank()) {
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant
                    ) {
                        Text(
                            text = "Obs: ${item.notes}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }

                Text(
                    text = "MT ${String.format("%.2f", item.unitPrice)} un.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            QuantitySelector(
                quantity = item.quantity,
                onQuantityChange = { newQty -> onUpdateQuantity(item, newQty) },
                minQuantity = 0
            )

            Text(
                text = "MT ${String.format("%.2f", item.unitPrice * item.quantity)}",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.primary
                ),
                modifier = Modifier.width(90.dp),
                textAlign = androidx.compose.ui.text.style.TextAlign.End
            )

            IconButton(
                onClick = { onRemoveItem(item) },
                modifier = Modifier.testTag("remove_cart_item_${item.dishId}")
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Remover",
                    tint = MaterialTheme.colorScheme.error.copy(alpha = 0.7f)
                )
            }
        }
    }
}

@Composable
private fun OrderSummaryContent(
    isPt: Boolean,
    tableNumber: String,
    subtotal: Double,
    includeServiceFee: Boolean,
    onToggleServiceFee: (Boolean) -> Unit,
    serviceFee: Double,
    total: Double,
    onPlaceOrder: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = if (isPt) "Resumo da Comanda" else "Order Summary",
            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onSurface
        )

        Surface(
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.TableRestaurant,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = if (isPt) "Mesa de Atendimento: $tableNumber" else "Assigned Table: $tableNumber",
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }

        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))

        // Subtotal
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = if (isPt) "Subtotal dos Pratos" else "Items Subtotal", color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(text = "MT ${String.format("%.2f", subtotal)}", fontWeight = FontWeight.SemiBold)
        }

        // Service fee 10%
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(
                    checked = includeServiceFee,
                    onCheckedChange = onToggleServiceFee,
                    modifier = Modifier.size(28.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = if (isPt) "Taxa de Serviço (10%)" else "Service Tip (10%)",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Text(text = "MT ${String.format("%.2f", serviceFee)}", fontWeight = FontWeight.SemiBold)
        }

        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))

        // Grand Total
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = if (isPt) "Total Final" else "Total Amount",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
            )
            Text(
                text = "MT ${String.format("%.2f", total)}",
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.primary
                )
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Confirm Order Button
        Button(
            onClick = onPlaceOrder,
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White
            ),
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .testTag("confirm_order_button")
        ) {
            Icon(imageVector = Icons.Default.CheckCircle, contentDescription = null)
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                text = if (isPt) "Enviar Pedido para a Cozinha" else "Send Order to Kitchen",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
        }
    }
}
