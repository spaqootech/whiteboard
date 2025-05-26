"use client"

import { useState, useCallback } from "react"
import { TopNavigation } from "./top-navigation"
import { LeftToolbar } from "./left-toolbar"
import { RightSidebar } from "./right-sidebar"
import { MainCanvas } from "./main-canvas"
import { BottomBar } from "./bottom-bar"
import { ShareModal } from "./share-modal"
import { ExportModal } from "./export-modal"
import { DrawingProvider } from "./drawing-context"

export function WhiteboardInterface() {
  const [selectedTool, setSelectedTool] = useState("select")
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [whiteboardTitle, setWhiteboardTitle] = useState("Untitled Whiteboard")
  const [isVoiceActive, setIsVoiceActive] = useState(false)

  const handleExport = useCallback((format: string, options: any) => {
    // This will be handled by the canvas component
    console.log("Export requested:", format, options)
  }, [])

  const handleSave = useCallback(() => {
    // Auto-save functionality
    console.log("Saving whiteboard...")
  }, [])

  return (
    <DrawingProvider>
      <div className="h-screen w-full flex flex-col bg-white">
        <TopNavigation
          title={whiteboardTitle}
          onTitleChange={setWhiteboardTitle}
          onShare={() => setShowShareModal(true)}
          onExport={() => setShowExportModal(true)}
          onSave={handleSave}
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
