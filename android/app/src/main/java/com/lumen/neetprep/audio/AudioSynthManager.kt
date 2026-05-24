package com.lumen.neetprep.audio

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import java.io.Closeable
import kotlin.concurrent.thread
import kotlin.math.sin

class AudioSynthManager : Closeable {
    private var audioTrack: AudioTrack? = null
    private var isPlaying = false
    private var playbackThread: Thread? = null

    enum class WavesType {
        ALPHA_FOCUS,       // Alpha focus waves
        GAMMA_CONSOLIDATE, // Gamma consolidation waves
        BROWN_NOISE,       // Brownian background ocean rumble for ultimate noise masking
        COSMIC_DELTA       // Soft galactic sweep for stress relief
    }

    fun startSynth(type: WavesType) {
        stopSynth()
        
        isPlaying = true
        val sampleRate = 44100
        val minBufferSize = AudioTrack.getMinBufferSize(
            sampleRate,
            AudioFormat.CHANNEL_OUT_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        )

        try {
            audioTrack = AudioTrack.Builder()
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build()
                )
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(sampleRate)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build()
                )
                .setBufferSizeInBytes(minBufferSize * 2)
                .setTransferMode(AudioTrack.MODE_STREAM)
                .build()

            audioTrack?.play()
        } catch (e: Exception) {
            e.printStackTrace()
            return
        }

        playbackThread = thread(start = true, priority = Thread.MAX_PRIORITY) {
            val bufferSize = 1024
            val buffer = ShortArray(bufferSize)
            var phase = 0.0
            var lastValue = 0.0

            while (isPlaying) {
                for (i in 0 until bufferSize) {
                    when (type) {
                        WavesType.ALPHA_FOCUS -> {
                            val frequency = 160.0 + sin(2 * Math.PI * phase * 10 / sampleRate) * 5.0
                            buffer[i] = (sin(2 * Math.PI * phase * frequency / sampleRate) * 16000).toInt().toShort()
                            phase += 1.0
                        }
                        WavesType.GAMMA_CONSOLIDATE -> {
                            val carrier = sin(2 * Math.PI * phase * 220.0 / sampleRate)
                            val modulator = sin(2 * Math.PI * phase * 40.0 / sampleRate) * 0.5 + 0.5
                            buffer[i] = (carrier * modulator * 15000).toInt().toShort()
                            phase += 1.0
                        }
                        WavesType.BROWN_NOISE -> {
                            val white = (Math.random() * 2.0 - 1.0) * 8000.0
                            lastValue = (lastValue + (0.02 * white)) / 1.02
                            buffer[i] = lastValue.toInt().toShort()
                        }
                        WavesType.COSMIC_DELTA -> {
                            val f1 = sin(2 * Math.PI * phase * 65.0 / sampleRate)
                            val f2 = sin(2 * Math.PI * phase * 68.0 / sampleRate)
                            buffer[i] = ((f1 + f2) * 8000).toInt().toShort()
                            phase += 1.0
                        }
                    }
                }
                
                if (isPlaying) {
                    try {
                        audioTrack?.write(buffer, 0, buffer.size)
                    } catch (e: Exception) {
                        break
                    }
                }
            }
        }
    }

    fun stopSynth() {
        isPlaying = false
        try {
            playbackThread?.join(300)
        } catch (e: Exception) {
            // ignore
        }
        playbackThread = null
        try {
            audioTrack?.apply {
                if (state == AudioTrack.STATE_INITIALIZED) {
                    stop()
                    release()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        audioTrack = null
    }

    override fun close() {
        stopSynth()
    }
}
