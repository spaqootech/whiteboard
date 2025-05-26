"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Save, Download, Share2, ChevronDown, Settings, LogOut, Edit3, Check } from "lucide-react"

interface TopNavigationProps {
  title: string
  onTitleChange: (title: string) => void
  onShare: () => void
  onExport: () => void
  onSave: () => void
  lastSaved: Date
}

export function TopNavigation({ title, onTitleChange, onShare, onExport, onSave, lastSaved }: TopNavigationProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await onSave()
    setTimeout(() => setIsSaving(false), 1000)
  }

  const formatLastSaved = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      {/* Left Section */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <span className="text-gray-900 font-semibold text-lg">Whiteboard</span>
        </div>

        <div className="flex items-center space-x-2">
          {isEditingTitle ? (
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
              className="h-8 w-64 text-sm border-gray-300 focus:border-blue-500"
              autoFocus
            />
          ) : (
            <div
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-md transition-colors"
              onClick={() => setIsEditingTitle(true)}
            >
              <span className="text-gray-700 font-medium">{title}</span>
              <Edit3 className="w-4 h-4 text-gray-400" />
            </div>
          )}

          <div className="text-xs text-gray-500 ml-4">Saved {formatLastSaved(lastSaved)}</div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-4 border-gray-300 hover:bg-gray-50"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-600" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save
            </>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 px-4 border-gray-300 hover:bg-gray-50">
              <Download className="w-4 h-4 mr-2" />
              Export
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onExport}>Export as PDF</DropdownMenuItem>
            <DropdownMenuItem onClick={onExport}>Export as PNG</DropdownMenuItem>
            <DropdownMenuItem onClick={onExport}>Export as SVG</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button size="sm" onClick={onShare} className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="w-9 h-9 cursor-pointer ring-2 ring-transparent hover:ring-gray-200 transition-all">
              <AvatarImage src="/placeholder.svg?height=36&width=36" />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
                JD
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
