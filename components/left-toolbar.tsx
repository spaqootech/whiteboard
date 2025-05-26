"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  MousePointer2,
  Pencil,
  Square,
  Circle,
  Minus,
  StickyNote,
  Type,
  Eraser,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Hand,
} from "lucide-react"

interface LeftToolbarProps {
  selectedTool: string
  onToolSelect: (tool: string) => void
}

const tools = [
  { id: "select", icon: MousePointer2, label: "Select" },
  { id: "pencil", icon: Pencil, label: "Pencil" },
  { id: "rectangle", icon: Square, label: "Rectangle" },
  { id: "circle", icon: Circle, label: "Circle" },
  { id: "line", icon: Minus, label: "Line" },
  { id: "sticky", icon: StickyNote, label: "Sticky Note" },
  { id: "text", icon: Type, label: "Text" },
  { id: "eraser", icon: Eraser, label: "Eraser" },
]

const actions = [
  { id: "undo", icon: Undo, label: "Undo" },
  { id: "redo", icon: Redo, label: "Redo" },
  { id: "zoom-in", icon: ZoomIn, label: "Zoom In" },
  { id: "zoom-out", icon: ZoomOut, label: "Zoom Out" },
  { id: "hand", icon: Hand, label: "Pan" },
]

export function LeftToolbar({ selectedTool, onToolSelect }: LeftToolbarProps) {
  return (
    <TooltipProvider>
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 shadow-sm">
        <div className="flex flex-col space-y-2">
          {tools.map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={selectedTool === tool.id ? "default" : "ghost"}
                  size="icon"
                  className={`w-10 h-10 ${
                    selectedTool === tool.id
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  } transition-all duration-200`}
                  onClick={() => onToolSelect(tool.id)}
                >
                  <tool.icon className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-900 text-white">
                <p>{tool.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <Separator className="my-4 w-8 bg-gray-300" />

        <div className="flex flex-col space-y-2">
          {actions.map((action) => (
            <Tooltip key={action.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
                  onClick={() => onToolSelect(action.id)}
                >
                  <action.icon className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-900 text-white">
                <p>{action.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  )
}
