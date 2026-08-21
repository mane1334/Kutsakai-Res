package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.StarBorder
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.Dish
import com.example.data.model.Language
import com.example.data.model.RatingRecord
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun RatingsScreen(
    dishes: List<Dish>,
    ratings: List<RatingRecord>,
    selectedLanguage: Language,
    onSubmitRating: (Int, String, String?, String?) -> Unit,
    modifier: Modifier = Modifier
) {
    val isPt = selectedLanguage == Language.PT
    var overallStars by remember { mutableIntStateOf(5) }
    var selectedDishId by remember { mutableStateOf<String?>(null) }
    var commentText by remember { mutableStateOf("") }
    val dateFormat = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())

    BoxWithConstraints(
        modifier = modifier
            .fillMaxSize()
            .padding(24.dp)
    ) {
        val isWideTablet = maxWidth >= 720.dp

        if (isWideTablet) {
            Row(
                modifier = Modifier.fillMaxSize(),
                horizontalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                // Left Column: Rate form
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
                    ),
                    modifier = Modifier
                        .weight(1.3f)
                        .fillMaxHeight()
                ) {
                    RatingFormContent(
                        isPt = isPt,
                        overallStars = overallStars,
                        onStarsChange = { overallStars = it },
                        dishes = dishes,
                        selectedDishId = selectedDishId,
                        onSelectDish = { selectedDishId = it },
                        commentText = commentText,
                        onCommentChange = { commentText = it },
                        onSubmit = {
                            val selectedDish = dishes.find { d -> d.id == selectedDishId }
                            val dishName = if (selectedDish != null) {
                                if (isPt) selectedDish.name else selectedDish.nameEn
                            } else null

                            onSubmitRating(overallStars, commentText, selectedDishId, dishName)
                            commentText = ""
                            selectedDishId = null
                        }
                    )
                }

                // Right Column: Ratings Feed
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
                    ),
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                ) {
                    RatingFeedContent(
                        isPt = isPt,
                        ratings = ratings,
                        dateFormat = dateFormat
                    )
                }
            }
        } else {
            // Stacked Portrait View
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    RatingFormContent(
                        isPt = isPt,
                        overallStars = overallStars,
                        onStarsChange = { overallStars = it },
                        dishes = dishes,
                        selectedDishId = selectedDishId,
                        onSelectDish = { selectedDishId = it },
                        commentText = commentText,
                        onCommentChange = { commentText = it },
                        onSubmit = {
                            val selectedDish = dishes.find { d -> d.id == selectedDishId }
                            val dishName = if (selectedDish != null) {
                                if (isPt) selectedDish.name else selectedDish.nameEn
                            } else null

                            onSubmitRating(overallStars, commentText, selectedDishId, dishName)
                            commentText = ""
                            selectedDishId = null
                        }
                    )
                }

                if (ratings.isNotEmpty()) {
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        RatingFeedContent(
                            isPt = isPt,
                            ratings = ratings,
                            dateFormat = dateFormat
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun RatingFormContent(
    isPt: Boolean,
    overallStars: Int,
    onStarsChange: (Int) -> Unit,
    dishes: List<Dish>,
    selectedDishId: String?,
    onSelectDish: (String?) -> Unit,
    commentText: String,
    onCommentChange: (String) -> Unit,
    onSubmit: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        Text(
            text = if (isPt) "Avalie sua Experiência Gastronômica" else "Rate Your Dining Experience",
            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onSurface
        )

        Text(
            text = if (isPt) "Sua avaliação nos ajuda a manter a excelência culinária e o atendimento impecável." else "Your feedback helps us maintain culinary excellence and impeccable service.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        // Star Picker
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = when (overallStars) {
                    5 -> if (isPt) "⭐⭐⭐⭐⭐ Excelente!" else "⭐⭐⭐⭐⭐ Excellent!"
                    4 -> if (isPt) "⭐⭐⭐⭐ Muito Bom!" else "⭐⭐⭐⭐ Very Good!"
                    3 -> if (isPt) "⭐⭐⭐ Bom" else "⭐⭐⭐ Good"
                    2 -> if (isPt) "⭐⭐ Regular" else "⭐⭐ Fair"
                    else -> if (isPt) "⭐ Precisa Melhorar" else "⭐ Needs Improvement"
                },
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.primary
            )

            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                for (i in 1..5) {
                    IconButton(
                        onClick = { onStarsChange(i) },
                        modifier = Modifier
                            .size(48.dp)
                            .testTag("star_rate_$i")
                    ) {
                        Icon(
                            imageVector = if (i <= overallStars) Icons.Default.Star else Icons.Default.StarBorder,
                            contentDescription = "$i Estrelas",
                            tint = if (i <= overallStars) Color(0xFFFFD700) else MaterialTheme.colorScheme.outline,
                            modifier = Modifier.size(36.dp)
                        )
                    }
                }
            }
        }

        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))

        // Dish evaluation chips
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                text = if (isPt) "Avaliar um prato específico (opcional):" else "Rate a specific dish (optional):",
                style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold)
            )

            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                FilterChip(
                    selected = selectedDishId == null,
                    onClick = { onSelectDish(null) },
                    label = { Text(if (isPt) "Geral" else "General") }
                )

                dishes.take(3).forEach { dish ->
                    FilterChip(
                        selected = selectedDishId == dish.id,
                        onClick = { onSelectDish(dish.id) },
                        label = { Text(if (isPt) dish.name.take(16) else dish.nameEn.take(16), maxLines = 1) }
                    )
                }
            }
        }

        // Comment input
        OutlinedTextField(
            value = commentText,
            onValueChange = onCommentChange,
            placeholder = {
                Text(
                    text = if (isPt) "Deixe seu comentário sobre a comida, harmonização ou atendimento..." else "Leave your thoughts on the food, pairings or service...",
                    style = MaterialTheme.typography.bodySmall
                )
            },
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier
                .fillMaxWidth()
                .testTag("rating_comment_input"),
            minLines = 3,
            maxLines = 4
        )

        Button(
            onClick = onSubmit,
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White
            ),
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .testTag("submit_rating_button")
        ) {
            Icon(imageVector = Icons.Default.Star, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = if (isPt) "Publicar Avaliação" else "Submit Review",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
        }
    }
}

@Composable
private fun RatingFeedContent(
    isPt: Boolean,
    ratings: List<RatingRecord>,
    dateFormat: SimpleDateFormat
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = if (isPt) "Avaliações Recentes (${ratings.size})" else "Recent Reviews (${ratings.size})",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onSurface
        )

        if (ratings.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (isPt) "Nenhuma avaliação publicada ainda." else "No reviews published yet.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        } else {
            Column(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("ratings_feed_list")
            ) {
                ratings.forEach { r ->
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
                        )
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                                    for (s in 1..r.overallStars) {
                                        Text(text = "⭐", fontSize = 12.sp)
                                    }
                                }
                                Text(
                                    text = dateFormat.format(Date(r.timestamp)),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }

                            if (r.dishName != null) {
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.6f)
                                ) {
                                    Text(
                                        text = "Prato: ${r.dishName}",
                                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                        color = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }

                            if (r.comment.isNotBlank()) {
                                Text(
                                    text = "\"${r.comment}\"",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
