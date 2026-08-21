package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.Language
import com.example.data.model.WaiterCall
import com.example.data.model.WaiterCallStatus
import com.example.data.model.WaiterCallType
import com.example.ui.theme.StatusReady
import com.example.ui.theme.StatusSuccess
import com.example.ui.theme.StatusWarning
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun WaiterCallScreen(
    tableNumber: String,
    waiterCalls: List<WaiterCall>,
    selectedLanguage: Language,
    onCallWaiter: (WaiterCallType, String) -> Unit,
    modifier: Modifier = Modifier
) {
    val isPt = selectedLanguage == Language.PT
    var selectedType by remember { mutableStateOf(WaiterCallType.WAITER) }
    var notesText by remember { mutableStateOf("") }
    val timeFormat = SimpleDateFormat("HH:mm:ss", Locale.getDefault())

    val callTypes = listOf(
        WaiterCallType.WAITER to ("Chamar Garçom" to "Call Waiter"),
        WaiterCallType.BILL to ("Pedir a Conta / Maquininha" to "Ask for Bill / Payment Machine"),
        WaiterCallType.KITCHEN to ("Falar com a Cozinha" to "Talk to Kitchen"),
        WaiterCallType.CLEAN_TABLE to ("Limpeza da Mesa / Trocar Pratos" to "Table Cleaning / Change Plates"),
        WaiterCallType.MANAGER to ("Solicitar Gerente" to "Request Manager")
    )

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
                // Left Column: Call Options & Submission Card
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
                    ),
                    modifier = Modifier
                        .weight(1.2f)
                        .fillMaxHeight()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        ServiceCallForm(
                            isPt = isPt,
                            tableNumber = tableNumber,
                            callTypes = callTypes,
                            selectedType = selectedType,
                            onSelectType = { selectedType = it },
                            notesText = notesText,
                            onNotesChange = { notesText = it }
                        )

                        // Send Button
                        Button(
                            onClick = {
                                onCallWaiter(selectedType, notesText)
                                notesText = ""
                            },
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary,
                                contentColor = Color.White
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp)
                                .testTag("send_waiter_call_button")
                        ) {
                            Icon(imageVector = Icons.Default.NotificationsActive, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = if (isPt) "Enviar Chamada para Atendimento" else "Dispatch Service Request",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                            )
                        }
                    }
                }

                // Right Column: Call History & Status
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
                    ServiceCallHistory(
                        isPt = isPt,
                        waiterCalls = waiterCalls,
                        timeFormat = timeFormat
                    )
                }
            }
        } else {
            // Portrait / Stacked layout
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
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        ServiceCallForm(
                            isPt = isPt,
                            tableNumber = tableNumber,
                            callTypes = callTypes,
                            selectedType = selectedType,
                            onSelectType = { selectedType = it },
                            notesText = notesText,
                            onNotesChange = { notesText = it }
                        )

                        Button(
                            onClick = {
                                onCallWaiter(selectedType, notesText)
                                notesText = ""
                            },
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary,
                                contentColor = Color.White
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                                .testTag("send_waiter_call_button")
                        ) {
                            Icon(imageVector = Icons.Default.NotificationsActive, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = if (isPt) "Enviar Chamada" else "Dispatch Request",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                            )
                        }
                    }
                }

                if (waiterCalls.isNotEmpty()) {
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        ServiceCallHistory(
                            isPt = isPt,
                            waiterCalls = waiterCalls,
                            timeFormat = timeFormat
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ServiceCallForm(
    isPt: Boolean,
    tableNumber: String,
    callTypes: List<Pair<WaiterCallType, Pair<String, String>>>,
    selectedType: WaiterCallType,
    onSelectType: (WaiterCallType) -> Unit,
    notesText: String,
    onNotesChange: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = if (isPt) "Solicitar Atendimento" else "Request Table Service",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onSurface
            )
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = MaterialTheme.colorScheme.primaryContainer
            ) {
                Text(
                    text = tableNumber,
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                )
            }
        }

        Text(
            text = if (isPt) "Selecione o tipo de atendimento desejado:" else "Select the type of assistance requested:",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        // Type Options
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            callTypes.forEach { (type, labels) ->
                val isSelected = selectedType == type
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (isSelected) MaterialTheme.colorScheme.primary else Color.Transparent
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onSelectType(type) }
                        .testTag("call_type_${type.name}")
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(text = type.icon, fontSize = 22.sp)
                        Text(
                            text = if (isPt) labels.first else labels.second,
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                            ),
                            color = if (isSelected) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.weight(1f)
                        )
                        RadioButton(
                            selected = isSelected,
                            onClick = { onSelectType(type) }
                        )
                    }
                }
            }
        }

        // Optional Notes
        OutlinedTextField(
            value = notesText,
            onValueChange = onNotesChange,
            placeholder = {
                Text(
                    text = if (isPt) "Alguma observação adicional? (opcional)" else "Any additional notes? (optional)",
                    style = MaterialTheme.typography.bodySmall
                )
            },
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .testTag("waiter_call_notes_input"),
            maxLines = 2
        )
    }
}

@Composable
private fun ServiceCallHistory(
    isPt: Boolean,
    waiterCalls: List<WaiterCall>,
    timeFormat: SimpleDateFormat
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = if (isPt) "Histórico de Chamadas" else "Call History",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onSurface
        )

        if (waiterCalls.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.NotificationsNone,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(48.dp)
                    )
                    Text(
                        text = if (isPt) "Nenhuma chamada realizada ainda." else "No service requests yet.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            Column(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("waiter_calls_list")
            ) {
                waiterCalls.forEach { call ->
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
                        )
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Text(text = call.type.icon, fontSize = 20.sp)
                                Column {
                                    Text(
                                        text = if (isPt) call.type.labelPt else call.type.labelEn,
                                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                                    )
                                    Text(
                                        text = timeFormat.format(Date(call.timestamp)),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }

                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = when (call.status) {
                                    WaiterCallStatus.PENDING -> StatusWarning.copy(alpha = 0.2f)
                                    WaiterCallStatus.IN_PROGRESS -> StatusReady.copy(alpha = 0.2f)
                                    WaiterCallStatus.RESOLVED -> StatusSuccess.copy(alpha = 0.2f)
                                }
                            ) {
                                Text(
                                    text = if (isPt) call.status.labelPt else call.status.labelEn,
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = when (call.status) {
                                            WaiterCallStatus.PENDING -> StatusWarning
                                            WaiterCallStatus.IN_PROGRESS -> StatusReady
                                            WaiterCallStatus.RESOLVED -> StatusSuccess
                                        }
                                    ),
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
