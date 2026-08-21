package com.example.util

import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Kiosk mode service that monitors user interaction and triggers screensaver after
 * inactivity threshold (default: 15 minutes = 900,000 ms).
 */
class KioskService(
    private val coroutineScope: CoroutineScope,
    private val onInactivityTriggered: () -> Unit
) {
    companion object {
        const val DEFAULT_TIMEOUT_MINUTES = 15
        const val DEFAULT_TIMEOUT_MS = DEFAULT_TIMEOUT_MINUTES * 60 * 1000L
    }

    private var _timeoutMs: Long = DEFAULT_TIMEOUT_MS
    private var _isEnabled: Boolean = true
    private var _lastActivityTimestamp: Long = System.currentTimeMillis()

    private val _isScreensaverActive = MutableStateFlow(false)
    val isScreensaverActive: StateFlow<Boolean> = _isScreensaverActive.asStateFlow()

    private val _remainingSecondsToScreensaver = MutableStateFlow(DEFAULT_TIMEOUT_MINUTES * 60)
    val remainingSecondsToScreensaver: StateFlow<Int> = _remainingSecondsToScreensaver.asStateFlow()

    private var monitoringJob: Job? = null

    init {
        startMonitoring()
    }

    fun setTimeoutMinutes(minutes: Int) {
        _timeoutMs = (minutes.coerceAtLeast(1)) * 60 * 1000L
        _remainingSecondsToScreensaver.value = minutes * 60
        recordActivity()
    }

    fun setEnabled(enabled: Boolean) {
        _isEnabled = enabled
        if (!enabled) {
            _isScreensaverActive.value = false
        } else {
            recordActivity()
        }
    }

    fun recordActivity() {
        _lastActivityTimestamp = System.currentTimeMillis()
        if (_isScreensaverActive.value) {
            // Activity occurred
        }
    }

    fun triggerScreensaverManually() {
        _isScreensaverActive.value = true
        onInactivityTriggered()
    }

    fun dismissScreensaver() {
        _isScreensaverActive.value = false
        recordActivity()
    }

    private fun startMonitoring() {
        monitoringJob?.cancel()
        monitoringJob = coroutineScope.launch(Dispatchers.Default) {
            while (isActive) {
                delay(1000L)
                if (!_isEnabled) continue

                val now = System.currentTimeMillis()
                val elapsed = now - _lastActivityTimestamp
                val remainingMs = (_timeoutMs - elapsed).coerceAtLeast(0)
                _remainingSecondsToScreensaver.value = (remainingMs / 1000).toInt()

                if (elapsed >= _timeoutMs && !_isScreensaverActive.value) {
                    _isScreensaverActive.value = true
                    withContext(Dispatchers.Main) {
                        onInactivityTriggered()
                    }
                }
            }
        }
    }

    fun destroy() {
        monitoringJob?.cancel()
    }
}
