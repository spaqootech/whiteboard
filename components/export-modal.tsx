"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileText, ImageIcon, Code, CheckCircle } from "lucide-react"
import { useDrawing } from "./drawing-context"

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: (format: string, options: any) => void
}

export function ExportModal({ isOpen, onClose, onExport }: ExportModalProps) {
  const [format, setFormat] = useState("png")
  const [quality, setQuality] = useState("high")
  const [includeBackground, setIncludeBackground] = useState(true)
  const [includeGrid, setIncludeGrid] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportComplete, setExportComplete] = useState(false)

  const { state } = useDrawing()

  const formatOptions = [
    { value: "pdf", label: "PDF Document", icon: FileText, description: "Vector format, best for printing" },
    { value: "png", label: "PNG Image", icon: ImageIcon, description: "High quality raster image" },
    { value: "svg", label: "SVG Vector", icon: Code, description: "Scalable vector graphics" },
  ]

  const handleExport = async () => {
    setIsExporting(true)

    const options = {
      quality,
      includeBackground,
      includeGrid,
      elements: state.elements,
      zoom: state.zoom,
      pan: state.pan,
    }

    // Simulate export process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    onExport(format, options)
    setIsExporting(false)
    setExportComplete(true)

    // Auto close after success
    setTimeout(() => {
      setExportComplete(false)
      onClose()
    }, 1500)
  }

  const handleClose = () => {
    if (!isExporting) {
      setExportComplete(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Download className="w-5 h-5 mr-2" />
            Export Whiteboard
          </DialogTitle>
        </DialogHeader>

        {exportComplete ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="w-16 h-16 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Export Complete!</h3>
            <p className="text-sm text-gray-500 text-center">Your whiteboard has been exported successfully.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Export Format</Label>
              <RadioGroup value={format} onValueChange={setFormat} className="space-y-2">
                {formatOptions.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <option.icon className="w-4 h-4 text-gray-600" />
                        <Label htmlFor={option.value} className="font-medium cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Separator />

            {/* Quality Settings */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Quality</Label>
              <Select value={quality} onValueChange={setQuality}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (Faster export)</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High (Best quality)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Export Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Options</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="background" checked={includeBackground} onCheckedChange={setIncludeBackground} />
                  <Label htmlFor="background" className="text-sm cursor-pointer">
                    Include background
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="grid" checked={includeGrid} onCheckedChange={setIncludeGrid} />
                  <Label htmlFor="grid" className="text-sm cursor-pointer">
                    Include grid lines
                  </Label>
                </div>
              </div>
            </div>

            {/* Export Info */}
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-xs text-gray-600 space-y-1">
                <div>Elements to export: {state.elements.length}</div>
                <div>Canvas size: {Math.round(state.zoom * 100)}% zoom</div>
                <div>Format: {format.toUpperCase()}</div>
              </div>
            </div>

            {/* Export Button */}
            <div className="flex space-x-2 pt-4">
              <Button variant="outline" onClick={handleClose} className="flex-1" disabled={isExporting}>
                Cancel
              </Button>
              <Button onClick={handleExport} className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isExporting}>
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
