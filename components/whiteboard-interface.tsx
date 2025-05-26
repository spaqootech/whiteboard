"use client"

import { useState, useCallback, useEffect } from "react"
import { TopNavigation } from "./top-navigation"
import { LeftToolbar } from "./left-toolbar"
import { RightSidebar } from "./right-sidebar"
import { MainCanvas } from "./main-canvas"
import { BottomBar } from "./bottom-bar"
import { ShareModal } from "./share-modal"
import { ExportModal } from "./export-modal"
import { DrawingProvider } from "./drawing-context"

export function WhiteboardInterface() {
  const [selectedTool, setSelectedTool] = useState("pencil")
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [whiteboardTitle, setWhiteboardTitle] = useState("My Whiteboard")
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date>(new Date())

  const handleExport = useCallback((format: string, options: any) => {
    // In a real app, this would generate and download the actual file
    console.log("Exporting whiteboard:", { format, options })

    // Simulate file download
    const filename = `whiteboard-${Date.now()}.${format}`
    console.log(`Downloaded: ${filename}`)
  }, [])

  const handleSave = useCallback(() => {
    // In a real app, this would save to a backend service
    setLastSaved(new Date())
    console.log("Whiteboard saved successfully")
  }, [])

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleSave()
    }, 30000)

    return () => clearInterval(interval)
  }, [handleSave])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "s":
            e.preventDefault()
            handleSave()
            break
          case "e":
            e.preventDefault()
            setShowExportModal(true)
            break
          case "1":
            e.preventDefault()
            setSelectedTool("select")
            break
          case "2":
            e.preventDefault()
            setSelectedTool("pencil")
            break
          case "3":
            e.preventDefault()
            setSelectedTool("rectangle")
            break
          case "4":
            e.preventDefault()
            setSelectedTool("circle")
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleSave])

  return (
    <DrawingProvider>
      <div className="h-screen w-full flex flex-col bg-white">
        <TopNavigation
          title={whiteboardTitle}
          onTitleChange={setWhiteboardTitle}
          onShare={() => setShowShareModal(true)}
          onExport={() => setShowExportModal(true)}
          onSave={handleSave}
          lastSaved={lastSaved}
        />

        <div className="flex-1 flex relative">
          <LeftToolbar selectedTool={selectedTool} onToolSelect={setSelectedTool} />

          <MainCanvas selectedTool={selectedTool} className="flex-1" />

          <RightSidebar
            isOpen={isRightSidebarOpen}
            onToggle={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            isVoiceActive={isVoiceActive}
            onVoiceToggle={() => setIsVoiceActive(!isVoiceActive)}
          />
        </div>

        <BottomBar selectedTool={selectedTool} isVoiceActive={isVoiceActive} />

        <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} />

        <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} onExport={handleExport} />
      </div>
    </DrawingProvider>
  )
}
