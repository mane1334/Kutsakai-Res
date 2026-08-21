package com.example.util

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.media.ToneGenerator
import android.os.Build
import android.os.CombinedVibration
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlin.math.PI
import kotlin.math.exp
import kotlin.math.sin

object FeedbackManager {

    /**
     * Plays a pleasant harmonic confirmation chime and performs a brief haptic pulse.
     * @param context Android context
     * @param volumeLevel normalized volume level between 0f and 1f
     */
    fun triggerCartSuccessFeedback(context: Context, volumeLevel: Float = 0.8f) {
        triggerHapticPulse(context)
        playSuccessChime(volumeLevel)
    }

    /**
     * Plays an audible celebratory 3-tone chime and double haptic pulse when an order is Ready from the kitchen.
     */
    fun triggerOrderReadyFeedback(context: Context, volumeLevel: Float = 0.9f) {
        triggerDoubleHapticPulse(context)
        playOrderReadyChime(volumeLevel)
    }

    /**
     * Double haptic pulse for urgent/ready notifications
     */
    fun triggerDoubleHapticPulse(context: Context) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                val vibrator = vibratorManager?.defaultVibrator
                vibrator?.vibrate(
                    VibrationEffect.createWaveform(longArrayOf(0, 100, 80, 140), -1)
                )
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                @Suppress("DEPRECATION")
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                vibrator?.vibrate(
                    VibrationEffect.createWaveform(longArrayOf(0, 100, 80, 140), -1)
                )
            } else {
                @Suppress("DEPRECATION")
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                @Suppress("DEPRECATION")
                vibrator?.vibrate(200)
            }
        } catch (_: Exception) {
            // Graceful fallback
        }
    }

    /**
     * Brief subtle haptic feedback pulse
     */
    fun triggerHapticPulse(context: Context) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                val vibrator = vibratorManager?.defaultVibrator
                vibrator?.vibrate(
                    VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK)
                )
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                @Suppress("DEPRECATION")
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                vibrator?.vibrate(
                    VibrationEffect.createOneShot(40, VibrationEffect.DEFAULT_AMPLITUDE)
                )
            } else {
                @Suppress("DEPRECATION")
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                @Suppress("DEPRECATION")
                vibrator?.vibrate(40)
            }
        } catch (_: Exception) {
            // Graceful fallback if vibration is disabled or unavailable on hardware
        }
    }

    /**
     * Synthesizes and plays a smooth, modern 2-tone melodic harmonic chime (E6 -> A6) with soft decay.
     */
    private fun playSuccessChime(volumeLevel: Float) {
        if (volumeLevel <= 0.01f) return

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val sampleRate = 44100
                val durationMs = 280
                val totalSamples = (sampleRate * (durationMs / 1000.0)).toInt()
                val audioBuffer = ShortArray(totalSamples)

                val note1Freq = 1318.51 // E6 note
                val note2Freq = 1760.00 // A6 note

                val splitIndex = (totalSamples * 0.4).toInt()

                for (i in 0 until totalSamples) {
                    val t = i.toDouble() / sampleRate
                    val sample: Double
                    if (i < splitIndex) {
                        // Note 1 (E6) with rapid attack and warm decay
                        val progress = i.toDouble() / splitIndex
                        val envelope = (1.0 - exp(-progress * 25.0)) * exp(-progress * 3.5)
                        sample = sin(2.0 * PI * note1Freq * t) * envelope
                    } else {
                        // Note 2 (A6) ringing clear
                        val note2Index = i - splitIndex
                        val note2Total = totalSamples - splitIndex
                        val progress = note2Index.toDouble() / note2Total
                        val envelope = (1.0 - exp(-progress * 30.0)) * exp(-progress * 4.0)
                        sample = (sin(2.0 * PI * note2Freq * t) * 0.85 + sin(2.0 * PI * (note2Freq * 2) * t) * 0.15) * envelope
                    }

                    val scaledVolume = (volumeLevel.coerceIn(0.1f, 1.0f) * 0.75f)
                    val shortVal = (sample * Short.MAX_VALUE * scaledVolume).toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt())
                    audioBuffer[i] = shortVal.toShort()
                }

                val audioTrack = AudioTrack.Builder()
                    .setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                    .setAudioFormat(
                        AudioFormat.Builder()
                            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setSampleRate(sampleRate)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                            .build()
                    )
                    .setBufferSizeInBytes(audioBuffer.size * 2)
                    .setTransferMode(AudioTrack.MODE_STATIC)
                    .build()

                audioTrack.write(audioBuffer, 0, audioBuffer.size)
                audioTrack.play()

                // Release after playback finishes
                kotlinx.coroutines.delay(durationMs + 100L)
                audioTrack.stop()
                audioTrack.release()
            } catch (_: Exception) {
                // Fallback to ToneGenerator if AudioTrack fails
                try {
                    val toneGen = ToneGenerator(AudioManager.STREAM_MUSIC, (volumeLevel * 80).toInt().coerceIn(10, 100))
                    toneGen.startTone(ToneGenerator.TONE_PROP_ACK, 150)
                } catch (_: Exception) {
                    // Ignore on non-audio environments
                }
            }
        }
    }

    /**
     * Synthesizes and plays a celebratory 3-tone arpeggio fanfare (C5 -> E5 -> G5 -> C6) for when food is ready.
     */
    private fun playOrderReadyChime(volumeLevel: Float) {
        if (volumeLevel <= 0.01f) return

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val sampleRate = 44100
                val durationMs = 600
                val totalSamples = (sampleRate * (durationMs / 1000.0)).toInt()
                val audioBuffer = ShortArray(totalSamples)

                val freqs = doubleArrayOf(523.25, 659.25, 783.99, 1046.50) // C5, E5, G5, C6
                val noteLen = totalSamples / freqs.size

                for (i in 0 until totalSamples) {
                    val noteIndex = (i / noteLen).coerceIn(0, freqs.size - 1)
                    val noteProgress = (i % noteLen).toDouble() / noteLen
                    val freq = freqs[noteIndex]
                    val t = i.toDouble() / sampleRate

                    val attack = (1.0 - exp(-noteProgress * 30.0))
                    val decay = exp(-noteProgress * 3.0)
                    val envelope = attack * decay

                    val sample = (sin(2.0 * PI * freq * t) * 0.8 + sin(2.0 * PI * (freq * 2) * t) * 0.2) * envelope
                    val scaledVolume = (volumeLevel.coerceIn(0.1f, 1.0f) * 0.85f)
                    val shortVal = (sample * Short.MAX_VALUE * scaledVolume).toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt())
                    audioBuffer[i] = shortVal.toShort()
                }

                val audioTrack = AudioTrack.Builder()
                    .setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                    .setAudioFormat(
                        AudioFormat.Builder()
                            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setSampleRate(sampleRate)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                            .build()
                    )
                    .setBufferSizeInBytes(audioBuffer.size * 2)
                    .setTransferMode(AudioTrack.MODE_STATIC)
                    .build()

                audioTrack.write(audioBuffer, 0, audioBuffer.size)
                audioTrack.play()

                kotlinx.coroutines.delay(durationMs + 100L)
                audioTrack.stop()
                audioTrack.release()
            } catch (_: Exception) {
                try {
                    val toneGen = ToneGenerator(AudioManager.STREAM_NOTIFICATION, (volumeLevel * 90).toInt().coerceIn(10, 100))
                    toneGen.startTone(ToneGenerator.TONE_PROP_BEEP2, 400)
                } catch (_: Exception) {
                    // Ignore on non-audio environments
                }
            }
        }
    }
}
