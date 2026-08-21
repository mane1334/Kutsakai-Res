package com.example.ui.screens

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.data.model.Category
import com.example.data.model.Dish
import com.example.data.model.Language
import com.example.ui.components.CategoriesRowSkeleton
import com.example.ui.components.DishCard
import com.example.ui.components.HomeFeaturedDishesSkeleton
import com.example.ui.viewmodel.NavigationTab

@Composable
fun HomeScreen(
    featuredDishes: List<Dish>,
    categories: List<Category>,
    advertisements: List<com.example.data.model.Advertisement> = emptyList(),
    selectedLanguage: Language,
    onNavigate: (NavigationTab) -> Unit,
    onSelectCategory: (String?) -> Unit,
    onDishClick: (Dish) -> Unit,
    onQuickAdd: (Dish) -> Unit,
    modifier: Modifier = Modifier,
    isLoading: Boolean = false
) {
    val isPt = selectedLanguage == Language.PT
    val activePromo = advertisements.firstOrNull { it.isActive }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        // Hero Announcement / Ads Promotion Banner
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primary
            ),
            elevation = CardDefaults.cardElevation(defaultElevation = 6.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(230.dp)
                .testTag("home_hero_banner")
        ) {
            Box(modifier = Modifier.fillMaxSize()) {
                com.example.ui.components.DishImage(
                    imageUrl = activePromo?.imageUrl,
                    drawableResName = "hero_restaurant_banner",
                    contentDescription = activePromo?.title ?: "Hero Banner",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )

                // Sleek wine gradient overlay
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(
                                    MaterialTheme.colorScheme.primary.copy(alpha = 0.95f),
                                    MaterialTheme.colorScheme.primary.copy(alpha = 0.75f),
                                    Color.Transparent
                                )
                            )
                        )
                )

                // Banner text & CTA
                Column(
                    modifier = Modifier
                        .align(Alignment.CenterStart)
                        .padding(28.dp)
                        .widthIn(max = 500.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = Color.White.copy(alpha = 0.2f)
                    ) {
                        Text(
                            text = if (activePromo != null) (if (isPt) "📢 PROMOÇÃO ATIVA" else "📢 ACTIVE PROMOTION") else (if (isPt) "RECOMENDAÇÃO" else "RECOMMENDATION"),
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                letterSpacing = 1.2.sp
                            ),
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }

                    Text(
                        text = activePromo?.title ?: if (isPt) "Especial do Chef:\nVinho & Risoto" else "Chef's Special:\nWine & Risotto",
                        style = MaterialTheme.typography.headlineMedium.copy(
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White,
                            fontSize = 24.sp,
                            lineHeight = 28.sp
                        ),
                        maxLines = 2
                    )

                    Text(
                        text = if (activePromo != null && activePromo.content.isNotBlank()) activePromo.content else if (isPt) "Experiência completa por MT 149,00" else "Complete tasting experience for MT 149.00",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = Color.White.copy(alpha = 0.9f)
                        ),
                        maxLines = 2
                    )

                    Spacer(modifier = Modifier.height(2.dp))

                    Button(
                        onClick = { onNavigate(NavigationTab.MENU) },
                        shape = RoundedCornerShape(50.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.White,
                            contentColor = MaterialTheme.colorScheme.primary
                        ),
                        modifier = Modifier.testTag("hero_explore_menu_button")
                    ) {
                        Text(
                            text = if (isPt) "Ver Cardápio" else "Explore Menu",
                            style = MaterialTheme.typography.labelMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        )
                    }
                }
            }
        }

        // Quick Feature Tiles (Chef IA, Call Waiter, Order Status)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            FeatureActionCard(
                title = if (isPt) "Sommelier & Chef IA" else "AI Sommelier",
                subtitle = if (isPt) "Pergunte sobre vinhos e pratos" else "Ask about food & wine pairings",
                icon = Icons.Default.SmartToy,
                badge = "IA 2.5",
                containerColor = MaterialTheme.colorScheme.primaryContainer,
                contentColor = MaterialTheme.colorScheme.primary,
                onClick = { onNavigate(NavigationTab.AI_CHAT) },
                modifier = Modifier.weight(1f)
            )

            FeatureActionCard(
                title = if (isPt) "Chamar Atendimento" else "Call Table Service",
                subtitle = if (isPt) "Garçom, Cozinha ou Conta" else "Waiter, Kitchen or Bill",
                icon = Icons.Default.RoomService,
                badge = if (isPt) "Rápido" else "Quick",
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.onSurface,
                onClick = { onNavigate(NavigationTab.WAITER_CALL) },
                modifier = Modifier.weight(1f)
            )

            FeatureActionCard(
                title = if (isPt) "Acompanhar Pedido" else "Order Status",
                subtitle = if (isPt) "Status da cozinha em tempo real" else "Real-time kitchen progress",
                icon = Icons.Default.ReceiptLong,
                badge = "Ao Vivo",
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.onSurface,
                onClick = { onNavigate(NavigationTab.ORDERS) },
                modifier = Modifier.weight(1f)
            )
        }

        // Categories Carousel
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (isPt) "Categorias do Menu" else "Menu Categories",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface
                )

                TextButton(onClick = {
                    onSelectCategory(null)
                    onNavigate(NavigationTab.MENU)
                }) {
                    Text(
                        text = if (isPt) "Ver todas" else "View all",
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        imageVector = Icons.Default.ArrowForward,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            if (isLoading && categories.isEmpty()) {
                CategoriesRowSkeleton()
            } else {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    item {
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = MaterialTheme.colorScheme.primary,
                            shadowElevation = 2.dp,
                            modifier = Modifier
                                .clickable {
                                    onSelectCategory(null)
                                    onNavigate(NavigationTab.MENU)
                                }
                                .testTag("home_category_all")
                        ) {
                            Text(
                                text = if (isPt) "Tudo" else "All",
                                style = MaterialTheme.typography.labelMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                ),
                                modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp)
                            )
                        }
                    }

                    items(categories) { category ->
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = MaterialTheme.colorScheme.surface,
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                            modifier = Modifier
                                .clickable {
                                    onSelectCategory(category.id)
                                    onNavigate(NavigationTab.MENU)
                                }
                                .testTag("home_category_${category.id}")
                        ) {
                            Text(
                                text = if (isPt) category.namePt else category.nameEn,
                                style = MaterialTheme.typography.labelMedium.copy(
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                ),
                                modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp)
                            )
                        }
                    }
                }
            }
        }

        // Featured Chef Dishes Section
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Text(
                text = if (isPt) "⭐ Pratos em Destaque do Chef" else "⭐ Chef's Featured Dishes",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onSurface
            )

            if (isLoading && featuredDishes.isEmpty()) {
                HomeFeaturedDishesSkeleton()
            } else {
                // Tablet 2-3 column layout
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    featuredDishes.take(3).forEach { dish ->
                        Box(modifier = Modifier.weight(1f)) {
                            DishCard(
                                dish = dish,
                                selectedLanguage = selectedLanguage,
                                onDishClick = onDishClick,
                                onQuickAdd = onQuickAdd
                            )
                        }
                    }
                }
            }
        }

        // AI Assistant Assistant Footer Banner
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = MaterialTheme.colorScheme.primaryContainer,
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onNavigate(NavigationTab.AI_CHAT) }
                .testTag("home_ai_assistant_banner")
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(Color.White)
                            .border(1.dp, MaterialTheme.colorScheme.outline, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = "🤖", fontSize = 22.sp)
                    }

                    Column {
                        Text(
                            text = if (isPt) "Dúvidas sobre o menu?" else "Questions about the menu?",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = if (isPt) "Pergunte ao nosso Assistente IA" else "Ask our AI Sommelier Assistant",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = Color.White,
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                    modifier = Modifier.clickable { onNavigate(NavigationTab.AI_CHAT) }
                ) {
                    Text(
                        text = if (isPt) "Abrir" else "Open",
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        ),
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun FeatureActionCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    badge: String,
    containerColor: Color,
    contentColor: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = containerColor),
        modifier = modifier
            .clickable { onClick() }
            .testTag("feature_card_${title.lowercase().replace(" ", "_")}")
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(contentColor.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = title,
                        tint = contentColor,
                        modifier = Modifier.size(22.dp)
                    )
                }

                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = contentColor.copy(alpha = 0.2f)
                ) {
                    Text(
                        text = badge,
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = contentColor,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                    )
                }
            }

            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = contentColor
            )

            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = contentColor.copy(alpha = 0.8f),
                maxLines = 1
            )
        }
    }
}
