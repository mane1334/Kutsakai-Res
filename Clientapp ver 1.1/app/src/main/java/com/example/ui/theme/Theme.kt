package com.example.ui.theme

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import com.example.data.model.AppThemeType

private val WineLightColorScheme = lightColorScheme(
    primary = WinePrimary,
    onPrimary = Color.White,
    primaryContainer = WineSurfaceSoft,
    onPrimaryContainer = WinePrimaryDark,
    secondary = WineSecondary,
    onSecondary = Color.White,
    background = WineBgLight,
    onBackground = WineTextPrimary,
    surface = WineCardBg,
    onSurface = WineTextPrimary,
    surfaceVariant = WineSurfaceSoft,
    onSurfaceVariant = WineTextSecondary,
    outline = WineBorder
)

private val WineDarkColorScheme = darkColorScheme(
    primary = DarkPrimary,
    onPrimary = Color.Black,
    primaryContainer = WineSecondary,
    onPrimaryContainer = Color.White,
    secondary = DarkPrimary,
    onSecondary = Color.Black,
    background = DarkBackground,
    onBackground = DarkTextPrimary,
    surface = DarkSurface,
    onSurface = DarkTextPrimary,
    surfaceVariant = DarkCard,
    onSurfaceVariant = DarkTextSecondary,
    outline = DarkBorder
)

private val OceanColorScheme = lightColorScheme(
    primary = OceanPrimary,
    onPrimary = Color.White,
    primaryContainer = OceanSurface,
    onPrimaryContainer = OceanTextPrimary,
    secondary = OceanSecondary,
    onSecondary = Color.White,
    background = OceanBackground,
    onBackground = OceanTextPrimary,
    surface = Color.White,
    onSurface = OceanTextPrimary,
    surfaceVariant = OceanSurface,
    onSurfaceVariant = OceanTextSecondary,
    outline = OceanPrimary.copy(alpha = 0.3f)
)

private val SunsetColorScheme = lightColorScheme(
    primary = SunsetPrimary,
    onPrimary = Color.White,
    primaryContainer = SunsetSurface,
    onPrimaryContainer = SunsetTextPrimary,
    secondary = SunsetSecondary,
    onSecondary = Color.White,
    background = SunsetBackground,
    onBackground = SunsetTextPrimary,
    surface = Color.White,
    onSurface = SunsetTextPrimary,
    surfaceVariant = SunsetSurface,
    onSurfaceVariant = SunsetTextSecondary,
    outline = SunsetPrimary.copy(alpha = 0.3f)
)

private val ForestColorScheme = lightColorScheme(
    primary = ForestPrimary,
    onPrimary = Color.White,
    primaryContainer = ForestSurface,
    onPrimaryContainer = ForestTextPrimary,
    secondary = ForestSecondary,
    onSecondary = Color.White,
    background = ForestBackground,
    onBackground = ForestTextPrimary,
    surface = Color.White,
    onSurface = ForestTextPrimary,
    surfaceVariant = ForestSurface,
    onSurfaceVariant = ForestTextSecondary,
    outline = ForestPrimary.copy(alpha = 0.3f)
)

private val LuxuryColorScheme = darkColorScheme(
    primary = LuxuryPrimary,
    onPrimary = Color.Black,
    primaryContainer = LuxurySurface,
    onPrimaryContainer = LuxuryPrimary,
    secondary = LuxurySecondary,
    onSecondary = Color.Black,
    background = LuxuryBackground,
    onBackground = LuxuryTextPrimary,
    surface = LuxurySurface,
    onSurface = LuxuryTextPrimary,
    surfaceVariant = LuxuryCard,
    onSurfaceVariant = LuxuryTextSecondary,
    outline = LuxuryBorder
)

@Composable
fun InteractiveRestaurantesTheme(
    themeType: AppThemeType = AppThemeType.LIGHT,
    content: @Composable () -> Unit
) {
    val targetScheme = when (themeType) {
        AppThemeType.LIGHT -> WineLightColorScheme
        AppThemeType.DARK -> WineDarkColorScheme
        AppThemeType.OCEAN -> OceanColorScheme
        AppThemeType.SUNSET -> SunsetColorScheme
        AppThemeType.FOREST -> ForestColorScheme
        AppThemeType.LUXURY -> LuxuryColorScheme
    }

    // Smooth animated color transitions (300ms cubic-bezier transition)
    val animDuration = 300
    val primary = animateColorAsState(targetScheme.primary, tween(animDuration), label = "primary").value
    val onPrimary = animateColorAsState(targetScheme.onPrimary, tween(animDuration), label = "onPrimary").value
    val background = animateColorAsState(targetScheme.background, tween(animDuration), label = "background").value
    val onBackground = animateColorAsState(targetScheme.onBackground, tween(animDuration), label = "onBackground").value
    val surface = animateColorAsState(targetScheme.surface, tween(animDuration), label = "surface").value
    val onSurface = animateColorAsState(targetScheme.onSurface, tween(animDuration), label = "onSurface").value
    val surfaceVariant = animateColorAsState(targetScheme.surfaceVariant, tween(animDuration), label = "surfaceVariant").value
    val onSurfaceVariant = animateColorAsState(targetScheme.onSurfaceVariant, tween(animDuration), label = "onSurfaceVariant").value
    val outline = animateColorAsState(targetScheme.outline, tween(animDuration), label = "outline").value

    val animatedColorScheme = if (targetScheme.background.red < 0.5f) {
        darkColorScheme(
            primary = primary,
            onPrimary = onPrimary,
            primaryContainer = surfaceVariant,
            onPrimaryContainer = onSurface,
            secondary = primary,
            onSecondary = onPrimary,
            background = background,
            onBackground = onBackground,
            surface = surface,
            onSurface = onSurface,
            surfaceVariant = surfaceVariant,
            onSurfaceVariant = onSurfaceVariant,
            outline = outline
        )
    } else {
        lightColorScheme(
            primary = primary,
            onPrimary = onPrimary,
            primaryContainer = surfaceVariant,
            onPrimaryContainer = onSurface,
            secondary = primary,
            onSecondary = onPrimary,
            background = background,
            onBackground = onBackground,
            surface = surface,
            onSurface = onSurface,
            surfaceVariant = surfaceVariant,
            onSurfaceVariant = onSurfaceVariant,
            outline = outline
        )
    }

    MaterialTheme(
        colorScheme = animatedColorScheme,
        typography = Typography,
        content = content
    )
}
