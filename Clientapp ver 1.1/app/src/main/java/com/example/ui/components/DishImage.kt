package com.example.ui.components

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.example.R

@Composable
fun DishImage(
    imageUrl: String?,
    drawableResName: String? = null,
    contentDescription: String? = null,
    modifier: Modifier = Modifier,
    contentScale: ContentScale = ContentScale.Crop,
    defaultFallbackResId: Int = R.drawable.hero_restaurant_banner
) {
    val context = LocalContext.current

    val fallbackDrawableId = remember(drawableResName) {
        if (!drawableResName.isNullOrBlank()) {
            try {
                val id = context.resources.getIdentifier(drawableResName, "drawable", context.packageName)
                if (id != 0) id else defaultFallbackResId
            } catch (e: Exception) {
                defaultFallbackResId
            }
        } else {
            defaultFallbackResId
        }
    }

    val imageModel = remember(imageUrl, fallbackDrawableId) {
        if (!imageUrl.isNullOrBlank()) {
            ImageRequest.Builder(context)
                .data(imageUrl)
                .crossfade(300)
                .error(fallbackDrawableId)
                .placeholder(fallbackDrawableId)
                .build()
        } else {
            fallbackDrawableId
        }
    }

    Box(modifier = modifier) {
        AsyncImage(
            model = imageModel,
            contentDescription = contentDescription,
            contentScale = contentScale,
            modifier = Modifier.fillMaxSize()
        )
    }
}
