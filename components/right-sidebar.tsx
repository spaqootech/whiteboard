"use client"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronLeft, ChevronRight, Mic, MicOff, Layers, Sparkles, ChevronDown } from "lucide-react"
import { useDrawing } from "./drawing-context"

interface RightSidebarProps {
  isOpen: boolean
  onToggle: () => void
  isVoiceActive: boolean
  onVoiceToggle: () => void
}

const colors = [
  "#000000",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
  "#FFC0CB",
]

export function RightSidebar({ isOpen, onToggle, isVoiceActive, onVoiceToggle }: RightSidebarProps) {
  const { state, setColor, setStrokeWidth, clearCanvas } = useDrawing()

  return (
    <div
      className={`bg-white border-l border-gray-200 shadow-sm transition-all duration-300 ${isOpen ? "w-80" : "w-12"}`}
    >
      <div className="h-full flex flex-col">
        {/* Toggle Button */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <Button variant="ghost" size="icon" onClick={onToggle} className="w-8 h-8 text-gray-600 hover:bg-gray-100">
            {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {isOpen && (
          <div className="flex-1 p-4 space-y-6 overflow-y-auto">
            {/* Color Palette */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Colors</h3>
              <div className="grid grid-cols-5 gap-2">
                {colors.map((color, index) => (
                  <button
                    key={index}
                    className={`w-8 h-8 rounded-lg border-2 transition-colors shadow-sm ${
                      state.currentColor === color
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setColor(color)}
                  />
                ))}
              </div>
              <div className="text-xs text-gray-500">Current: {state.currentColor}</div>
            </div>

            <Separator className="bg-gray-200" />

            {/* Stroke Thickness */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Stroke Width</h3>
              <div className="space-y-2">
                <Slider
                  value={[state.currentStrokeWidth]}
                  onValueChange={(value) => setStrokeWidth(value[0])}
                  max={20}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1px</span>
                  <span className="font-medium">{state.currentStrokeWidth}px</span>
                  <span>20px</span>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-200" />

            {/* Canvas Actions */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Canvas</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={clearCanvas}
                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                Clear Canvas
              </Button>
              <div className="text-xs text-gray-500">
                Elements: {state.elements.length} | Zoom: {Math.round(state.zoom * 100)}%
              </div>
            </div>

            <Separator className="bg-gray-200" />

            {/* Layers */}
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                  <Layers className="w-4 h-4 mr-2" />
                  Layers
                </h3>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <span className="text-sm text-gray-700">Drawing Layer</span>
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 hover:bg-gray-50 border border-gray-200 rounded-md cursor-pointer">
                    <span className="text-sm text-gray-700">Background</span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator className="bg-gray-200" />

            {/* AI Suggestions */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                AI Suggestions
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto p-3 border-gray-200 hover:bg-gray-50"
                >
                  <div className="text-left">
                    <div className="text-sm font-medium">Auto Layout</div>
                    <div className="text-xs text-gray-500">Organize elements automatically</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto p-3 border-gray-200 hover:bg-gray-50"
                >
                  <div className="text-left">
                    <div className="text-sm font-medium">Smart Connect</div>
                    <div className="text-xs text-gray-500">Connect related elements</div>
                  </div>
                </Button>
              </div>
            </div>

            <Separator className="bg-gray-200" />

            {/* Voice Input */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Voice Input</h3>
              <Button
                variant={isVoiceActive ? "default" : "outline"}
                size="sm"
                onClick={onVoiceToggle}
                className={`w-full ${
                  isVoiceActive ? "bg-red-600 hover:bg-red-700 text-white" : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                {isVoiceActive ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Start Recording
                  </>
                )}
              </Button>
              {isVoiceActive && (
                <div className="text-xs text-gray-500 text-center">Listening... Speak your commands</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
