package com.example.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Restaurant
import androidx.compose.material.icons.filled.TouchApp
import androidx.compose.material3.*
import androidx.compose.runtime.*
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
import com.example.data.model.Advertisement
import com.example.data.model.Dish
import com.example.data.model.Language
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*

sealed class ScreensaverItem {
    data class Ad(val ad: Advertisement) : ScreensaverItem()
    data class FeaturedDish(val dish: Dish) : ScreensaverItem()
}

@Composable
fun KioskScreensaver(
    featuredDishes: List<Dish>,
    advertisements: List<Advertisement> = emptyList(),
    restaurantName: String,
    tableNumber: String,
    selectedLanguage: Language,
    onDismiss: () -> Unit,
    onAdminUnlock: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isPt = selectedLanguage == Language.PT
    var currentIndex by remember { mutableIntStateOf(0) }
    var currentTimeString by remember { mutableStateOf("") }

    val activeSlides = remember(featuredDishes, advertisements) {
        val list = mutableListOf<ScreensaverItem>()
        advertisements.filter { it.isActive }.forEach { list.add(ScreensaverItem.Ad(it)) }
        featuredDishes.forEach { list.add(ScreensaverItem.FeaturedDish(it)) }
        if (list.isEmpty() && featuredDishes.isEmpty()) {
            list.add(ScreensaverItem.Ad(Advertisement(id = "default", title = restaurantName, content = "Gastronomia refinada & Atendimento digital")))
        }
        list
    }

    // Time ticker
    LaunchedEffect(Unit) {
        val format = SimpleDateFormat("HH:mm", Locale.getDefault())
        while (true) {
            currentTimeString = format.format(Date())
            delay(1000)
        }
    }

    // Auto rotate every 5 seconds
    LaunchedEffect(activeSlides) {
        if (activeSlides.isNotEmpty()) {
            while (true) {
                delay(5000)
                currentIndex = (currentIndex + 1) % activeSlides.size
            }
        }
    }

    val currentSlide = activeSlides.getOrNull(currentIndex % activeSlides.size.coerceAtLeast(1))

    val infiniteTransition = rememberInfiniteTransition(label = "kiosk_pulse")
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.5f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseAlpha"
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black)
            .clickable { onDismiss() }
            .testTag("kiosk_screensaver_view")
    ) {
        // Fullscreen background image with animated crossfade
        AnimatedContent(
            targetState = currentSlide,
            transitionSpec = {
                fadeIn(animationSpec = tween(900)) togetherWith fadeOut(animationSpec = tween(900))
            },
            label = "screensaver_image"
        ) { slide ->
            when (slide) {
                is ScreensaverItem.Ad -> {
                    DishImage(
                        imageUrl = slide.ad.imageUrl,
                        drawableResName = "hero_restaurant_banner",
                        contentDescription = slide.ad.title,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }
                is ScreensaverItem.FeaturedDish -> {
                    DishImage(
                        imageUrl = slide.dish.imageUrl,
                        drawableResName = slide.dish.drawableResName,
                        contentDescription = slide.dish.name,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }
                null -> {
                    androidx.compose.foundation.Image(
                        painter = painterResource(id = R.drawable.hero_restaurant_banner),
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }
        }

        // Dark gradient overlay
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color.Black.copy(alpha = 0.75f),
                            Color.Black.copy(alpha = 0.35f),
                            Color.Black.copy(alpha = 0.88f)
                        )
                    )
                )
        )

        // Top Header: Restaurant Branding, Table, Clock & Admin PIN Lock
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                androidx.compose.foundation.Image(
                    painter = painterResource(id = R.drawable.ic_restaurant_logo),
                    contentDescription = null,
                    modifier = Modifier
                        .size(56.dp)
                        .clip(RoundedCornerShape(14.dp))
                )
                Column {
                    Text(
                        text = restaurantName,
                        style = MaterialTheme.typography.headlineSmall.copy(
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    )
                    Text(
                        text = if (isPt) "Experiência Gastronômica & Terminal Interativo" else "Dining Experience & Interactive Terminal",
                        style = MaterialTheme.typography.bodyMedium.copy(color = Color(0xFFFFD700))
                    )
                }
            }

            // Table, Clock & Admin Pin Unlock
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color.White.copy(alpha = 0.15f)
                ) {
                    Text(
                        text = tableNumber,
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        ),
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                }

                Text(
                    text = currentTimeString,
                    style = MaterialTheme.typography.headlineMedium.copy(
                        fontWeight = FontWeight.Light,
                        color = Color.White
                    )
                )

                // Admin Settings Unlock Button
                Surface(
                    shape = CircleShape,
                    color = Color.White.copy(alpha = 0.2f),
                    modifier = Modifier
                        .clip(CircleShape)
                        .clickable { onAdminUnlock() }
                        .testTag("kiosk_admin_unlock_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = if (isPt) "Acesso Admin / PIN" else "Admin PIN Access",
                        tint = Color.White,
                        modifier = Modifier
                            .padding(10.dp)
                            .size(20.dp)
                    )
                }
            }
        }

        // Bottom Presentation (Ad or Dish)
        if (currentSlide != null) {
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(40.dp)
                    .widthIn(max = 750.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                when (currentSlide) {
                    is ScreensaverItem.Ad -> {
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = MaterialTheme.colorScheme.primary.copy(alpha = 0.95f)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Campaign,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = if (isPt) "📢 PROMOÇÃO DO RESTAURANTE" else "📢 SPECIAL PROMOTION",
                                    style = MaterialTheme.typography.labelMedium.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                )
                            }
                        }

                        Text(
                            text = currentSlide.ad.title,
                            style = MaterialTheme.typography.headlineLarge.copy(
                                fontWeight = FontWeight.ExtraBold,
                                color = Color.White,
                                fontSize = 34.sp
                            )
                        )

                        if (currentSlide.ad.content.isNotBlank()) {
                            Text(
                                text = currentSlide.ad.content,
                                style = MaterialTheme.typography.bodyLarge.copy(
                                    color = Color.White.copy(alpha = 0.9f),
                                    lineHeight = 24.sp
                                ),
                                maxLines = 3
                            )
                        }
                    }
                    is ScreensaverItem.FeaturedDish -> {
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = Color(0xFF6D2430).copy(alpha = 0.95f)
                        ) {
                            Text(
                                text = if (isPt) "✨ Sugestão Especial do Chef" else "✨ Chef's Special Suggestion",
                                style = MaterialTheme.typography.labelMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                ),
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                            )
                        }

                        Text(
                            text = if (isPt) currentSlide.dish.name else currentSlide.dish.nameEn,
                            style = MaterialTheme.typography.headlineLarge.copy(
                                fontWeight = FontWeight.ExtraBold,
                                color = Color.White,
                                fontSize = 34.sp
                            )
                        )

                        Text(
                            text = if (isPt) currentSlide.dish.description else currentSlide.dish.descriptionEn,
                            style = MaterialTheme.typography.bodyLarge.copy(
                                color = Color.White.copy(alpha = 0.9f),
                                lineHeight = 22.sp
                            ),
                            maxLines = 2
                        )

                        Text(
                            text = String.format("MT %.2f", currentSlide.dish.price),
                            style = MaterialTheme.typography.headlineMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFFFD700)
                            )
                        )
                    }
                }
            }
        }

        // Bottom-Right "Tap to Open Menu" pill
        Surface(
            shape = RoundedCornerShape(30.dp),
            color = Color.White.copy(alpha = 0.2f),
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(40.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.padding(horizontal = 24.dp, vertical = 14.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.TouchApp,
                    contentDescription = null,
                    tint = Color.White.copy(alpha = pulseAlpha),
                    modifier = Modifier.size(28.dp)
                )
                Text(
                    text = if (isPt) "Toque na tela para pedir" else "Tap screen to order",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                )
            }
        }
    }
}

