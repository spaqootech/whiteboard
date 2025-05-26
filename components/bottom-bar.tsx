"use client"

import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Mic } from "lucide-react"

interface BottomBarProps {
  selectedTool: string
  isVoiceActive: boolean
}

const toolLabels: Record<string, string> = {
  select: "Select Tool",
  pencil: "Pencil Tool",
  rectangle: "Rectangle Tool",
  circle: "Circle Tool",
  line: "Line Tool",
  sticky: "Sticky Note Tool",
  text: "Text Tool",
  eraser: "Eraser Tool",
  undo: "Undo",
  redo: "Redo",
  "zoom-in": "Zoom In",
  "zoom-out": "Zoom Out",
  hand: "Pan Tool",
}

export function BottomBar({ selectedTool, isVoiceActive }: BottomBarProps) {
  const isConnected = true // Simulate connection status

  return (
    <div className="h-10 bg-gray-50 border-t border-gray-200 flex items-center justify-between px-6 text-sm">
      {/* Left Section - Connection Status */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="text-green-600 font-medium">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-600" />
              <span className="text-red-600 font-medium">Disconnected</span>
            </>
          )}
        </div>

        <div className="text-gray-500">3 collaborators online</div>
      </div>

      {/* Center Section - Current Tool */}
      <div className="flex items-center space-x-2">
        <span className="text-gray-600">Current tool:</span>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
          {toolLabels[selectedTool] || "Unknown Tool"}
        </Badge>
      </div>

      {/* Right Section - Voice Status */}
      <div className="flex items-center space-x-2">
        {isVoiceActive && (
          <>
            <Mic className="w-4 h-4 text-red-600 animate-pulse" />
            <span className="text-red-600 font-medium">Voice Active</span>
          </>
        )}
      </div>
    </div>
  )
}
