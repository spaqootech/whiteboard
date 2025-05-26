"use client"

import { useEffect, useState } from "react"
import type SpeechRecognition from "speech-recognition"

interface VoiceRecognitionProps {
  isActive: boolean
  onCommand: (command: string) => void
}

export function VoiceRecognition({ isActive, onCommand }: VoiceRecognitionProps) {
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [isListening, setIsListening] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const speechRecognition = new (window as any).webkitSpeechRecognition()
      speechRecognition.continuous = true
      speechRecognition.interimResults = true
      speechRecognition.lang = "en-US"

      speechRecognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join("")

        if (event.results[event.results.length - 1].isFinal) {
          onCommand(transcript.toLowerCase().trim())
        }
      }

      speechRecognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
      }

      speechRecognition.onend = () => {
        setIsListening(false)
      }

      setRecognition(speechRecognition)
    }
  }, [onCommand])

  useEffect(() => {
    if (!recognition) return

    if (isActive && !isListening) {
      recognition.start()
      setIsListening(true)
    } else if (!isActive && isListening) {
      recognition.stop()
      setIsListening(false)
    }
  }, [isActive, isListening, recognition])

  return null
}
