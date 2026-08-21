package com.example.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp

/**
 * Creates an animated linear shimmer brush.
 */
@Composable
fun shimmerBrush(showShimmer: Boolean = true, targetValue: Float = 1200f): Brush {
    return if (showShimmer) {
        val shimmerColors = listOf(
            MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
            MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f),
            MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
        )

        val transition = rememberInfiniteTransition(label = "shimmer_transition")
        val translateAnimation = transition.animateFloat(
            initialValue = 0f,
            targetValue = targetValue,
            animationSpec = infiniteRepeatable(
                animation = tween(
                    durationMillis = 1100,
                    easing = FastOutSlowInEasing
                ),
                repeatMode = RepeatMode.Restart
            ),
            label = "shimmer_translate"
        )

        Brush.linearGradient(
            colors = shimmerColors,
            start = Offset.Zero,
            end = Offset(x = translateAnimation.value, y = translateAnimation.value)
        )
    } else {
        Brush.linearGradient(
            colors = listOf(Color.Transparent, Color.Transparent),
            start = Offset.Zero,
            end = Offset.Zero
        )
    }
}

/**
 * Modifier extension to apply a shimmer placeholder block.
 */
@Composable
fun Modifier.shimmerPlaceholder(
    shape: Shape = RoundedCornerShape(8.dp),
    showShimmer: Boolean = true
): Modifier {
    val brush = shimmerBrush(showShimmer = showShimmer)
    return this
        .clip(shape)
        .background(brush)
}

/**
 * Shimmer Skeleton matching the DishCard structure.
 */
@Composable
fun DishCardSkeleton(
    modifier: Modifier = Modifier
) {
    val shimmer = shimmerBrush()

    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = modifier
            .fillMaxWidth()
            .border(
                width = 1.dp,
                color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                shape = RoundedCornerShape(24.dp)
            )
            .testTag("dish_card_skeleton")
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            // Image Placeholder with top rounded corners
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(170.dp)
                    .clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                    .background(shimmer)
            ) {
                // Prep time pill skeleton
                Box(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(10.dp)
                        .size(width = 60.dp, height = 22.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.7f))
                )

                // Rating pill skeleton
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(10.dp)
                        .size(width = 44.dp, height = 22.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.7f))
                )
            }

            // Body Content
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Dietary tag chips skeleton
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Box(
                        modifier = Modifier
                            .size(width = 72.dp, height = 18.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(shimmer)
                    )
                    Box(
                        modifier = Modifier
                            .size(width = 64.dp, height = 18.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(shimmer)
                    )
                }

                // Title Line skeleton
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.85f)
                        .height(20.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(shimmer)
                )

                // Subtitle / Description skeleton lines
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(0.95f)
                            .height(14.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .background(shimmer)
                    )
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(0.65f)
                            .height(14.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .background(shimmer)
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                // Bottom Price & Quick Add Button skeleton
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Box(
                            modifier = Modifier
                                .size(width = 40.dp, height = 10.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(shimmer)
                        )
                        Box(
                            modifier = Modifier
                                .size(width = 80.dp, height = 22.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .background(shimmer)
                        )
                    }

                    // Add Button circle skeleton
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(shimmer)
                    )
                }
            }
        }
    }
}

/**
 * Shimmer Skeleton matching the Category Filter Chip.
 */
@Composable
fun CategoryChipSkeleton(
    width: Int = 100,
    modifier: Modifier = Modifier
) {
    val shimmer = shimmerBrush()
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)),
        modifier = modifier
            .size(width = width.dp, height = 44.dp)
            .testTag("category_chip_skeleton")
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 14.dp, vertical = 10.dp)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(8.dp))
                    .background(shimmer)
            )
        }
    }
}

/**
 * Shimmer Skeleton Row for Category Tabs.
 */
@Composable
fun CategoriesRowSkeleton(
    modifier: Modifier = Modifier
) {
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        modifier = modifier
            .fillMaxWidth()
            .testTag("categories_row_skeleton"),
        userScrollEnabled = false
    ) {
        val widths = listOf(110, 95, 120, 85, 105, 115)
        items(widths.size) { index ->
            CategoryChipSkeleton(width = widths[index])
        }
    }
}

/**
 * Shimmer Grid for Menu Screen (3 columns).
 */
@Composable
fun MenuDishesGridSkeleton(
    itemCount: Int = 6,
    modifier: Modifier = Modifier
) {
    LazyVerticalGrid(
        columns = GridCells.Adaptive(minSize = 250.dp),
        horizontalArrangement = Arrangement.spacedBy(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        modifier = modifier
            .fillMaxWidth()
            .testTag("menu_dishes_grid_skeleton"),
        userScrollEnabled = false
    ) {
        items(itemCount) {
            DishCardSkeleton()
        }
    }
}

/**
 * Shimmer Skeleton Row for Home Featured Dishes.
 */
@Composable
fun HomeFeaturedDishesSkeleton(
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .testTag("home_featured_dishes_skeleton"),
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        repeat(3) {
            Box(modifier = Modifier.weight(1f)) {
                DishCardSkeleton()
            }
        }
    }
}
