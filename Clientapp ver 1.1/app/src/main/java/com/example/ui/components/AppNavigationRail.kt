package com.example.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.Language
import com.example.ui.viewmodel.NavigationTab

@Composable
fun AppNavigationRail(
    currentTab: NavigationTab,
    selectedLanguage: Language,
    cartItemCount: Int,
    activeOrderCount: Int,
    onTabSelected: (NavigationTab) -> Unit,
    modifier: Modifier = Modifier
) {
    val isPt = selectedLanguage == Language.PT

    Surface(
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 0.dp,
        modifier = modifier
            .width(96.dp)
            .fillMaxHeight()
            .border(
                width = 1.dp,
                color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxHeight()
                .verticalScroll(rememberScrollState())
                .padding(vertical = 12.dp, horizontal = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            val tabs = listOf(
                NavigationTab.HOME,
                NavigationTab.MENU,
                NavigationTab.CART,
                NavigationTab.ORDERS,
                NavigationTab.AI_CHAT,
                NavigationTab.WAITER_CALL,
                NavigationTab.RATINGS,
                NavigationTab.SETTINGS
            )

            tabs.forEach { tab ->
                val isSelected = currentTab == tab
                val itemBg = animateColorAsState(
                    targetValue = if (isSelected) MaterialTheme.colorScheme.primaryContainer else Color.Transparent,
                    animationSpec = tween(250),
                    label = "itemBg"
                ).value

                val itemColor = animateColorAsState(
                    targetValue = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                    animationSpec = tween(250),
                    label = "itemColor"
                ).value

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(itemBg)
                        .clickable { onTabSelected(tab) }
                        .padding(vertical = 10.dp, horizontal = 4.dp)
                        .testTag("nav_tab_${tab.route}"),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        BadgedBox(
                            badge = {
                                if (tab == NavigationTab.CART && cartItemCount > 0) {
                                    Badge(
                                        containerColor = MaterialTheme.colorScheme.error,
                                        contentColor = Color.White
                                    ) {
                                        Text(cartItemCount.toString(), fontSize = 10.sp)
                                    }
                                } else if (tab == NavigationTab.ORDERS && activeOrderCount > 0) {
                                    Badge(
                                        containerColor = MaterialTheme.colorScheme.primary,
                                        contentColor = Color.White
                                    ) {
                                        Text(activeOrderCount.toString(), fontSize = 10.sp)
                                    }
                                }
                            }
                        ) {
                            Icon(
                                imageVector = getTabIcon(tab),
                                contentDescription = if (isPt) tab.titlePt else tab.titleEn,
                                tint = itemColor,
                                modifier = Modifier.size(24.dp)
                            )
                        }

                        Text(
                            text = if (isPt) tab.titlePt else tab.titleEn,
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontSize = 11.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                            ),
                            color = itemColor,
                            textAlign = TextAlign.Center,
                            maxLines = 1
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun AppNavigationBar(
    currentTab: NavigationTab,
    selectedLanguage: Language,
    cartItemCount: Int,
    activeOrderCount: Int,
    onTabSelected: (NavigationTab) -> Unit,
    modifier: Modifier = Modifier
) {
    val isPt = selectedLanguage == Language.PT

    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 4.dp,
        modifier = modifier
    ) {
        val tabs = listOf(
            NavigationTab.HOME,
            NavigationTab.MENU,
            NavigationTab.CART,
            NavigationTab.ORDERS,
            NavigationTab.AI_CHAT,
            NavigationTab.WAITER_CALL,
            NavigationTab.RATINGS,
            NavigationTab.SETTINGS
        )

        tabs.forEach { tab ->
            val isSelected = currentTab == tab

            NavigationBarItem(
                selected = isSelected,
                onClick = { onTabSelected(tab) },
                icon = {
                    BadgedBox(
                        badge = {
                            if (tab == NavigationTab.CART && cartItemCount > 0) {
                                Badge(
                                    containerColor = MaterialTheme.colorScheme.error,
                                    contentColor = Color.White
                                ) {
                                    Text(cartItemCount.toString(), fontSize = 9.sp)
                                }
                            } else if (tab == NavigationTab.ORDERS && activeOrderCount > 0) {
                                Badge(
                                    containerColor = MaterialTheme.colorScheme.primary,
                                    contentColor = Color.White
                                ) {
                                    Text(activeOrderCount.toString(), fontSize = 9.sp)
                                }
                            }
                        }
                    ) {
                        Icon(
                            imageVector = getTabIcon(tab),
                            contentDescription = if (isPt) tab.titlePt else tab.titleEn
                        )
                    }
                },
                label = {
                    Text(
                        text = if (isPt) tab.titlePt else tab.titleEn,
                        fontSize = 10.sp,
                        maxLines = 1
                    )
                },
                modifier = Modifier.testTag("nav_bar_item_${tab.route}")
            )
        }
    }
}

private fun getTabIcon(tab: NavigationTab): ImageVector {
    return when (tab) {
        NavigationTab.HOME -> Icons.Default.Home
        NavigationTab.MENU -> Icons.Default.RestaurantMenu
        NavigationTab.CART -> Icons.Default.ShoppingCart
        NavigationTab.ORDERS -> Icons.Default.ReceiptLong
        NavigationTab.AI_CHAT -> Icons.Default.SmartToy
        NavigationTab.WAITER_CALL -> Icons.Default.RoomService
        NavigationTab.RATINGS -> Icons.Default.StarRate
        NavigationTab.SETTINGS -> Icons.Default.Settings
    }
}
