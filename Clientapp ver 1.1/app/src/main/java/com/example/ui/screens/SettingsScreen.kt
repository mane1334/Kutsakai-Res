package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.AppThemeType
import com.example.data.model.Language
import com.example.ui.viewmodel.RestaurantUiState

@Composable
fun SettingsScreen(
    uiState: RestaurantUiState,
    onSetTheme: (AppThemeType) -> Unit,
    onSetLanguage: (Language) -> Unit,
    onSetTableNumber: (String) -> Unit,
    onSetRestaurantName: (String) -> Unit,
    onSetBackendHost: (String) -> Unit,
    onSetVolume: (Float) -> Unit,
    onSetBrightness: (Float) -> Unit,
    onSetKioskModeEnabled: (Boolean) -> Unit,
    onSetKioskTimeout: (Int) -> Unit,
    onSetAdminPin: (String) -> Unit,
    onLockAdmin: () -> Unit,
    onActivateScreensaver: () -> Unit,
    onSimulateKitchenNotification: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val isPt = uiState.selectedLanguage == Language.PT
    val clipboardManager = androidx.compose.ui.platform.LocalClipboardManager.current
    var isTokenCopied by remember { mutableStateOf(false) }

    var editingTable by remember(uiState.tableNumber) { mutableStateOf(uiState.tableNumber) }
    var editingBackend by remember(uiState.backendHost) { mutableStateOf(uiState.backendHost) }
    var editingRestaurantName by remember(uiState.restaurantName) { mutableStateOf(uiState.restaurantName) }
    var editingPin by remember(uiState.adminPin) { mutableStateOf(uiState.adminPin) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        Text(
            text = if (isPt) "Configurações do Terminal" else "Terminal Settings",
            style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onSurface
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // Left Column: Visual Themes & Language & FCM Status
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                // Theme Selection Card
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Palette, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Text(
                                text = if (isPt) "Tema Visual da Aplicação" else "Visual Theme",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                            )
                        }

                        // 6 Themes Grid
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            AppThemeType.values().forEach { theme ->
                                val isSelected = uiState.selectedTheme == theme
                                val primaryColor = Color(android.graphics.Color.parseColor(theme.primaryHex))
                                val bgColor = Color(android.graphics.Color.parseColor(theme.bgHex))

                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                                    border = androidx.compose.foundation.BorderStroke(
                                        width = if (isSelected) 2.dp else 1.dp,
                                        color = if (isSelected) MaterialTheme.colorScheme.primary else Color.Transparent
                                    ),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { onSetTheme(theme) }
                                        .testTag("theme_option_${theme.name}")
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(horizontal = 14.dp, vertical = 10.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                                        ) {
                                            // Two-color circle swatch
                                            Box(
                                                modifier = Modifier
                                                    .size(28.dp)
                                                    .clip(CircleShape)
                                                    .background(primaryColor)
                                                    .border(2.dp, bgColor, CircleShape)
                                            )

                                            Text(
                                                text = theme.displayName,
                                                style = MaterialTheme.typography.bodyMedium.copy(
                                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                                ),
                                                color = if (isSelected) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface
                                            )
                                        }

                                        RadioButton(
                                            selected = isSelected,
                                            onClick = { onSetTheme(theme) }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Language Selection Card
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Language, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Text(
                                text = if (isPt) "Idioma / Language" else "Language / Idioma",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Language.values().forEach { lang ->
                                val isSelected = uiState.selectedLanguage == lang
                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                                    border = androidx.compose.foundation.BorderStroke(
                                        width = if (isSelected) 2.dp else 1.dp,
                                        color = if (isSelected) MaterialTheme.colorScheme.primary else Color.Transparent
                                    ),
                                    modifier = Modifier
                                        .weight(1f)
                                        .clickable { onSetLanguage(lang) }
                                        .testTag("lang_option_${lang.name}")
                                ) {
                                    Row(
                                        modifier = Modifier.padding(14.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        Text(text = lang.flag, fontSize = 20.sp)
                                        Text(
                                            text = lang.displayName,
                                            style = MaterialTheme.typography.bodyMedium.copy(
                                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                            ),
                                            color = if (isSelected) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Firebase Cloud Messaging (FCM) Card
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.NotificationsActive,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary
                                )
                                Text(
                                    text = if (isPt) "Firebase Cloud Messaging (FCM)" else "Firebase Cloud Messaging (FCM)",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                                )
                            }

                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = MaterialTheme.colorScheme.primaryContainer
                            ) {
                                Text(
                                    text = if (isPt) "🟢 Conectado" else "🟢 Connected",
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }

                        Text(
                            text = if (isPt)
                                "A cozinha/administração envia notificações push diretamente para este tablet quando o pedido muda para 'Pronto'."
                            else
                                "The kitchen/admin sends push notifications directly to this tablet when order status changes to 'Ready'.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        // Subscribed Topics
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                text = if (isPt) "Tópicos Inscritos:" else "Subscribed Topics:",
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold)
                            )
                            val topics = if (uiState.subscribedTopics.isNotEmpty()) {
                                uiState.subscribedTopics.joinToString(", ")
                            } else {
                                "table_${uiState.tableNumber.lowercase().replace(" ", "_")}, restaurant_orders_all"
                            }
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = topics,
                                    style = MaterialTheme.typography.bodySmall.copy(fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace),
                                    modifier = Modifier.padding(10.dp),
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        // Device Token & Copy Action
                        if (uiState.fcmToken != null) {
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(
                                    text = if (isPt) "Token do Dispositivo:" else "Device Registration Token:",
                                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold)
                                )
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Surface(
                                        shape = RoundedCornerShape(8.dp),
                                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Text(
                                            text = uiState.fcmToken?.take(32)?.plus("...") ?: "Aguardando token...",
                                            style = MaterialTheme.typography.bodySmall.copy(fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace),
                                            modifier = Modifier.padding(8.dp)
                                        )
                                    }
                                    FilledTonalButton(
                                        onClick = {
                                            uiState.fcmToken?.let { tok ->
                                                clipboardManager.setText(androidx.compose.ui.text.AnnotatedString(tok))
                                                isTokenCopied = true
                                            }
                                        },
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Icon(imageVector = Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(if (isTokenCopied) (if (isPt) "Copiado!" else "Copied!") else (if (isPt) "Copiar" else "Copy"))
                                    }
                                }
                            }
                        }

                        // Simulation Button
                        Button(
                            onClick = onSimulateKitchenNotification,
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("simulate_kitchen_push_button")
                        ) {
                            Icon(imageVector = Icons.Default.Send, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                if (isPt) "🔔 Testar Push da Cozinha (Pedido Pronto)" else "🔔 Test Kitchen Push (Order Ready)",
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // Right Column: Hardware & Terminal Config
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                // Table & Restaurant Identification
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(imageVector = Icons.Default.TableRestaurant, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Text(
                                text = if (isPt) "Identificação da Mesa" else "Table Identification",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                            )
                        }

                        OutlinedTextField(
                            value = editingRestaurantName,
                            onValueChange = {
                                editingRestaurantName = it
                                onSetRestaurantName(it)
                            },
                            label = { Text(if (isPt) "Nome do Restaurante" else "Restaurant Name") },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )

                        OutlinedTextField(
                            value = editingTable,
                            onValueChange = {
                                editingTable = it
                                onSetTableNumber(it)
                            },
                            label = { Text(if (isPt) "Número / Identificador da Mesa" else "Table Number / ID") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("table_number_input"),
                            shape = RoundedCornerShape(12.dp)
                        )

                        OutlinedTextField(
                            value = editingBackend,
                            onValueChange = {
                                editingBackend = it
                                onSetBackendHost(it)
                            },
                            label = { Text(if (isPt) "Endereço Servidor Backend (REST / WS)" else "Backend Server Address (REST / WS)") },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )
                    }
                }

                // Kiosk Mode & Admin Security Card
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Security,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary
                                )
                                Text(
                                    text = if (isPt) "Modo Kiosk & PIN Administrativo" else "Kiosk Mode & Admin PIN",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                                )
                            }

                            Switch(
                                checked = uiState.isKioskModeEnabled,
                                onCheckedChange = onSetKioskModeEnabled,
                                modifier = Modifier.testTag("kiosk_mode_toggle")
                            )
                        }

                        // Inactivity Timeout Selector
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(
                                text = if (isPt) "Tempo de Inatividade para Screensaver" else "Inactivity Timeout for Screensaver",
                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium)
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                val timeoutOptions = listOf(
                                    15 to (if (isPt) "15 min (Padrão)" else "15 min (Default)"),
                                    5 to "5 min",
                                    1 to "1 min"
                                )

                                timeoutOptions.forEach { (minutes, label) ->
                                    val isSelected = uiState.kioskTimeoutMinutes == minutes
                                    Surface(
                                        shape = RoundedCornerShape(10.dp),
                                        color = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                                        border = androidx.compose.foundation.BorderStroke(
                                            width = if (isSelected) 2.dp else 1.dp,
                                            color = if (isSelected) MaterialTheme.colorScheme.primary else Color.Transparent
                                        ),
                                        modifier = Modifier
                                            .weight(1f)
                                            .clickable { onSetKioskTimeout(minutes) }
                                            .testTag("timeout_option_${minutes}m")
                                    ) {
                                        Text(
                                            text = label,
                                            style = MaterialTheme.typography.bodySmall.copy(
                                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                                color = if (isSelected) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface
                                            ),
                                            textAlign = TextAlign.Center,
                                            modifier = Modifier.padding(vertical = 10.dp, horizontal = 4.dp)
                                        )
                                    }
                                }
                            }

                            // Live countdown status
                            if (uiState.isKioskModeEnabled) {
                                val min = uiState.remainingKioskSeconds / 60
                                val sec = uiState.remainingKioskSeconds % 60
                                Text(
                                    text = if (isPt) "Próximo descanso em: ${min}m ${sec}s de inatividade" else "Screensaver in: ${min}m ${sec}s of inactivity",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        color = MaterialTheme.colorScheme.primary,
                                        fontWeight = FontWeight.Medium
                                    )
                                )
                            }
                        }

                        // Change PIN Section
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(
                                text = if (isPt) "PIN Administrativo (4 dígitos)" else "Admin PIN (4 digits)",
                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium)
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                OutlinedTextField(
                                    value = editingPin,
                                    onValueChange = {
                                        if (it.length <= 4 && it.all { char -> char.isDigit() }) {
                                            editingPin = it
                                        }
                                    },
                                    label = { Text(if (isPt) "Novo PIN" else "New PIN") },
                                    modifier = Modifier
                                        .weight(1f)
                                        .testTag("admin_pin_input"),
                                    shape = RoundedCornerShape(12.dp),
                                    singleLine = true
                                )

                                Button(
                                    onClick = { onSetAdminPin(editingPin) },
                                    enabled = editingPin.length == 4 && editingPin != uiState.adminPin,
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.testTag("save_pin_button")
                                ) {
                                    Text(if (isPt) "Salvar" else "Save")
                                }
                            }
                        }

                        // Lock Admin & Return to Menu
                        FilledTonalButton(
                            onClick = onLockAdmin,
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.filledTonalButtonColors(
                                containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.7f),
                                contentColor = MaterialTheme.colorScheme.onErrorContainer
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("lock_admin_button")
                        ) {
                            Icon(imageVector = Icons.Default.Lock, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(if (isPt) "Bloquear Acesso Admin & Retornar" else "Lock Admin Access & Return to Menu")
                        }
                    }
                }

                // Volume & Brightness Sliders Card
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(
                            text = if (isPt) "Controles de Áudio e Brilho" else "Audio & Brightness Controls",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )

                        // Volume Slider
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Icon(imageVector = Icons.Default.VolumeUp, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Text(text = if (isPt) "Volume do Tablet" else "Tablet Volume", style = MaterialTheme.typography.bodySmall)
                                }
                                Text(text = "${(uiState.volume * 100).toInt()}%", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold)
                            }
                            Slider(
                                value = uiState.volume,
                                onValueChange = onSetVolume,
                                modifier = Modifier.testTag("volume_slider")
                            )
                        }

                        // Brightness Slider
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Icon(imageVector = Icons.Default.Brightness6, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Text(text = if (isPt) "Brilho da Tela" else "Screen Brightness", style = MaterialTheme.typography.bodySmall)
                                }
                                Text(text = "${(uiState.brightness * 100).toInt()}%", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold)
                            }
                            Slider(
                                value = uiState.brightness,
                                onValueChange = onSetBrightness,
                                modifier = Modifier.testTag("brightness_slider")
                            )
                        }

                        // Screensaver Action
                        OutlinedButton(
                            onClick = onActivateScreensaver,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("activate_screensaver_button")
                        ) {
                            Icon(imageVector = Icons.Default.Tv, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(if (isPt) "Iniciar Modo Screensaver / Descanso" else "Start Screensaver / Ambient Mode")
                        }
                    }
                }
            }
        }
    }
}
