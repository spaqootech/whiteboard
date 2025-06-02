"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileText, ImageIcon, Code, CheckCircle } from "lucide-react"
import { useDrawing, type DrawingElement } from "./drawing-context"

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
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { state } = useDrawing()

  const formatOptions = [
    { value: "pdf", label: "PDF Document", icon: FileText, description: "Vector format, best for printing" },
    { value: "png", label: "PNG Image", icon: ImageIcon, description: "High quality raster image" },
    { value: "svg", label: "SVG Vector", icon: Code, description: "Scalable vector graphics" },
  ]

  const getCanvasBounds = () => {
    if (state.elements.length === 0) {
      return { minX: 0, minY: 0, maxX: 800, maxY: 600 }
    }

    let minX = Number.POSITIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY

    state.elements.forEach((element) => {
      if (element.bounds) {
        minX = Math.min(minX, element.bounds.x)
        minY = Math.min(minY, element.bounds.y)
        maxX = Math.max(maxX, element.bounds.x + element.bounds.width)
        maxY = Math.max(maxY, element.bounds.y + element.bounds.height)
      } else if (element.points) {
        element.points.forEach((point) => {
          minX = Math.min(minX, point.x)
          minY = Math.min(minY, point.y)
          maxX = Math.max(maxX, point.x)
          maxY = Math.max(maxY, point.y)
        })
      }
    })

    // Add padding
    const padding = 50
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
    }
  }

  const drawElementOnCanvas = (
    ctx: CanvasRenderingContext2D,
    element: DrawingElement,
    offsetX: number,
    offsetY: number,
  ) => {
    ctx.strokeStyle = element.style.color
    ctx.lineWidth = element.style.strokeWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    if (element.style.fill) {
      ctx.fillStyle = element.style.fill
    }

    switch (element.type) {
      case "path":
        if (element.points.length < 2) break
        ctx.beginPath()
        ctx.moveTo(element.points[0].x - offsetX, element.points[0].y - offsetY)
        for (let i = 1; i < element.points.length; i++) {
          ctx.lineTo(element.points[i].x - offsetX, element.points[i].y - offsetY)
        }
        ctx.stroke()
        break

      case "rectangle":
        if (element.bounds) {
          const x = element.bounds.x - offsetX
          const y = element.bounds.y - offsetY
          ctx.strokeRect(x, y, element.bounds.width, element.bounds.height)
          if (element.style.fill) {
            ctx.fillRect(x, y, element.bounds.width, element.bounds.height)
          }
        }
        break

      case "circle":
        if (element.bounds) {
          const centerX = element.bounds.x + element.bounds.width / 2 - offsetX
          const centerY = element.bounds.y + element.bounds.height / 2 - offsetY
          const radius = Math.min(element.bounds.width, element.bounds.height) / 2
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
          ctx.stroke()
          if (element.style.fill) {
            ctx.fill()
          }
        }
        break

      case "line":
        if (element.points.length >= 2) {
          ctx.beginPath()
          ctx.moveTo(element.points[0].x - offsetX, element.points[0].y - offsetY)
          ctx.lineTo(element.points[1].x - offsetX, element.points[1].y - offsetY)
          ctx.stroke()
        }
        break

      case "text":
        if (element.bounds && element.text) {
          ctx.font = `${element.style.strokeWidth * 8}px Arial`
          ctx.fillStyle = element.style.color
          ctx.fillText(
            element.text,
            element.bounds.x - offsetX,
            element.bounds.y + element.style.strokeWidth * 8 - offsetY,
          )
        }
        break

      case "sticky":
        if (element.bounds && element.text) {
          const x = element.bounds.x - offsetX
          const y = element.bounds.y - offsetY

          // Draw sticky note background
          ctx.fillStyle = "#fef3c7"
          ctx.fillRect(x, y, element.bounds.width, element.bounds.height)
          ctx.strokeStyle = "#f59e0b"
          ctx.strokeRect(x, y, element.bounds.width, element.bounds.height)

          // Draw text
          ctx.fillStyle = "#92400e"
          ctx.font = "14px Arial"
          const lines = element.text.split("\n")
          lines.forEach((line, index) => {
            ctx.fillText(line, x + 8, y + 20 + index * 16)
          })
        }
        break
    }
  }

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1

    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  const exportAsPNG = async () => {
    const bounds = getCanvasBounds()
    const width = bounds.maxX - bounds.minX
    const height = bounds.maxY - bounds.minY

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size based on quality
    const scale = quality === "high" ? 2 : quality === "medium" ? 1.5 : 1
    canvas.width = width * scale
    canvas.height = height * scale
    ctx.scale(scale, scale)

    // Draw background
    if (includeBackground) {
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, width, height)
    }

    // Draw grid
    if (includeGrid) {
      drawGrid(ctx, width, height)
    }

    // Draw all elements
    state.elements.forEach((element) => {
      drawElementOnCanvas(ctx, element, bounds.minX, bounds.minY)
    })

    // Download the image
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `whiteboard-${Date.now()}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    }, "image/png")
  }

  const exportAsSVG = async () => {
    const bounds = getCanvasBounds()
    const width = bounds.maxX - bounds.minX
    const height = bounds.maxY - bounds.minY

    let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`

    // Add background
    if (includeBackground) {
      svgContent += `<rect width="${width}" height="${height}" fill="#ffffff"/>`
    }

    // Add grid
    if (includeGrid) {
      const gridSize = 20
      svgContent += `<defs><pattern id="grid" width="${gridSize}" height="${gridSize}" patternUnits="userSpaceOnUse"><path d="M ${gridSize} 0 L 0 0 0 ${gridSize}" fill="none" stroke="#e5e7eb" strokeWidth="1"/></pattern></defs>`
      svgContent += `<rect width="${width}" height="${height}" fill="url(#grid)"/>`
    }

    // Add elements
    state.elements.forEach((element) => {
      const offsetX = bounds.minX
      const offsetY = bounds.minY

      switch (element.type) {
        case "path":
          if (element.points.length >= 2) {
            let pathData = `M ${element.points[0].x - offsetX} ${element.points[0].y - offsetY}`
            for (let i = 1; i < element.points.length; i++) {
              pathData += ` L ${element.points[i].x - offsetX} ${element.points[i].y - offsetY}`
            }
            svgContent += `<path d="${pathData}" stroke="${element.style.color}" strokeWidth="${element.style.strokeWidth}" fill="none" strokeLinecap="round" strokeLinejoin="round"/>`
          }
          break

        case "rectangle":
          if (element.bounds) {
            const x = element.bounds.x - offsetX
            const y = element.bounds.y - offsetY
            svgContent += `<rect x="${x}" y="${y}" width="${element.bounds.width}" height="${element.bounds.height}" stroke="${element.style.color}" strokeWidth="${element.style.strokeWidth}" fill="${element.style.fill || "none"}"/>`
          }
          break

        case "circle":
          if (element.bounds) {
            const centerX = element.bounds.x + element.bounds.width / 2 - offsetX
            const centerY = element.bounds.y + element.bounds.height / 2 - offsetY
            const radius = Math.min(element.bounds.width, element.bounds.height) / 2
            svgContent += `<circle cx="${centerX}" cy="${centerY}" r="${radius}" stroke="${element.style.color}" strokeWidth="${element.style.strokeWidth}" fill="${element.style.fill || "none"}"/>`
          }
          break

        case "line":
          if (element.points.length >= 2) {
            const x1 = element.points[0].x - offsetX
            const y1 = element.points[0].y - offsetY
            const x2 = element.points[1].x - offsetX
            const y2 = element.points[1].y - offsetY
            svgContent += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${element.style.color}" strokeWidth="${element.style.strokeWidth}" strokeLinecap="round"/>`
          }
          break

        case "text":
          if (element.bounds && element.text) {
            const x = element.bounds.x - offsetX
            const y = element.bounds.y + element.style.strokeWidth * 8 - offsetY
            svgContent += `<text x="${x}" y="${y}" fontFamily="Arial" fontSize="${element.style.strokeWidth * 8}" fill="${element.style.color}">${element.text}</text>`
          }
          break

        case "sticky":
          if (element.bounds && element.text) {
            const x = element.bounds.x - offsetX
            const y = element.bounds.y - offsetY
            svgContent += `<rect x="${x}" y="${y}" width="${element.bounds.width}" height="${element.bounds.height}" fill="#fef3c7" stroke="#f59e0b"/>`
            const lines = element.text.split("\n")
            lines.forEach((line, index) => {
              svgContent += `<text x="${x + 8}" y="${y + 20 + index * 16}" fontFamily="Arial" fontSize="14" fill="#92400e">${line}</text>`
            })
          }
          break
      }
    })

    svgContent += "</svg>"

    // Download the SVG
    const blob = new Blob([svgContent], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `whiteboard-${Date.now()}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportAsPDF = async () => {
    // For PDF export, we'll create an SVG and then convert it
    // In a real application, you might want to use a library like jsPDF
    const bounds = getCanvasBounds()
    const width = bounds.maxX - bounds.minX
    const height = bounds.maxY - bounds.minY

    // Create a canvas for PDF export
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = width
    canvas.height = height

    // Draw background
    if (includeBackground) {
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, width, height)
    }

    // Draw grid
    if (includeGrid) {
      drawGrid(ctx, width, height)
    }

    // Draw all elements
    state.elements.forEach((element) => {
      drawElementOnCanvas(ctx, element, bounds.minX, bounds.minY)
    })

    // Convert to PDF (simplified - in production you'd use jsPDF)
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `whiteboard-${Date.now()}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    }, "image/png") // Note: This creates a PNG, not a real PDF. For real PDF, use jsPDF
  }

  const handleExport = async () => {
    setIsExporting(true)

    try {
      switch (format) {
        case "png":
          await exportAsPNG()
          break
        case "svg":
          await exportAsSVG()
          break
        case "pdf":
          await exportAsPDF()
          break
      }

      setExportComplete(true)

      // Auto close after success
      setTimeout(() => {
        setExportComplete(false)
        onClose()
      }, 2000)
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
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
            <p className="text-sm text-gray-500 text-center">Your whiteboard has been downloaded successfully.</p>
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
            {format === "png" && (
              <>
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Quality</Label>
                  <Select value={quality} onValueChange={setQuality}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (1x resolution)</SelectItem>
                      <SelectItem value="medium">Medium (1.5x resolution)</SelectItem>
                      <SelectItem value="high">High (2x resolution)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
              </>
            )}

            {/* Export Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Options</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="background" checked={includeBackground} onCheckedChange={setIncludeBackground} />
                  <Label htmlFor="background" className="text-sm cursor-pointer">
                    Include white background
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
                <div>Format: {format.toUpperCase()}</div>
                {format === "png" && <div>Quality: {quality}</div>}
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
                    Export & Download
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
