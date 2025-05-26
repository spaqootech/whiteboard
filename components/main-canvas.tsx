"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Grid3X3, Trash2 } from "lucide-react"
import { useDrawing, type DrawingElement } from "./drawing-context"

interface MainCanvasProps {
  selectedTool: string
  className?: string
}

export function MainCanvas({ selectedTool, className }: MainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showGrid, setShowGrid] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([])
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)

  const { state, addElement, deleteElements, selectElements, clearSelection, setZoom, setPan, undo, redo } =
    useDrawing()

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const container = containerRef.current
    if (!container) return

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      redrawCanvas()
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    return () => window.removeEventListener("resize", resizeCanvas)
  }, [])

  // Redraw canvas when elements change
  useEffect(() => {
    redrawCanvas()
  }, [state.elements, state.selectedElements, state.zoom, state.pan])

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply zoom and pan
    ctx.save()
    ctx.scale(state.zoom, state.zoom)
    ctx.translate(state.pan.x, state.pan.y)

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, canvas.width / state.zoom, canvas.height / state.zoom)
    }

    // Draw all elements
    state.elements.forEach((element) => {
      drawElement(ctx, element, state.selectedElements.includes(element.id))
    })

    // Draw current path while drawing
    if (isDrawing && currentPath.length > 0) {
      ctx.strokeStyle = state.currentColor
      ctx.lineWidth = state.currentStrokeWidth
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      if (selectedTool === "pencil") {
        drawPath(ctx, currentPath)
      } else if (selectedTool === "rectangle" && startPoint && currentPath.length > 0) {
        const endPoint = currentPath[currentPath.length - 1]
        drawRectangle(ctx, startPoint, endPoint)
      } else if (selectedTool === "circle" && startPoint && currentPath.length > 0) {
        const endPoint = currentPath[currentPath.length - 1]
        drawCircle(ctx, startPoint, endPoint)
      } else if (selectedTool === "line" && startPoint && currentPath.length > 0) {
        const endPoint = currentPath[currentPath.length - 1]
        drawLine(ctx, startPoint, endPoint)
      }
    }

    ctx.restore()
  }, [state, showGrid, isDrawing, currentPath, startPoint, selectedTool])

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

  const drawElement = (ctx: CanvasRenderingContext2D, element: DrawingElement, isSelected: boolean) => {
    ctx.strokeStyle = element.style.color
    ctx.lineWidth = element.style.strokeWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    if (element.style.fill) {
      ctx.fillStyle = element.style.fill
    }

    switch (element.type) {
      case "path":
        drawPath(ctx, element.points)
        break
      case "rectangle":
        if (element.bounds) {
          ctx.strokeRect(element.bounds.x, element.bounds.y, element.bounds.width, element.bounds.height)
          if (element.style.fill) {
            ctx.fillRect(element.bounds.x, element.bounds.y, element.bounds.width, element.bounds.height)
          }
        }
        break
      case "circle":
        if (element.bounds) {
          const centerX = element.bounds.x + element.bounds.width / 2
          const centerY = element.bounds.y + element.bounds.height / 2
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
          drawLine(ctx, element.points[0], element.points[1])
        }
        break
      case "text":
        if (element.bounds && element.text) {
          ctx.font = `${element.style.strokeWidth * 8}px Arial`
          ctx.fillStyle = element.style.color
          ctx.fillText(element.text, element.bounds.x, element.bounds.y + element.style.strokeWidth * 8)
        }
        break
      case "sticky":
        if (element.bounds && element.text) {
          // Draw sticky note background
          ctx.fillStyle = "#fef3c7"
          ctx.fillRect(element.bounds.x, element.bounds.y, element.bounds.width, element.bounds.height)
          ctx.strokeStyle = "#f59e0b"
          ctx.strokeRect(element.bounds.x, element.bounds.y, element.bounds.width, element.bounds.height)

          // Draw text
          ctx.fillStyle = "#92400e"
          ctx.font = "14px Arial"
          const lines = element.text.split("\n")
          lines.forEach((line, index) => {
            ctx.fillText(line, element.bounds!.x + 8, element.bounds!.y + 20 + index * 16)
          })
        }
        break
    }

    // Draw selection indicator
    if (isSelected && element.bounds) {
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(element.bounds.x - 5, element.bounds.y - 5, element.bounds.width + 10, element.bounds.height + 10)
      ctx.setLineDash([])
    }
  }

  const drawPath = (ctx: CanvasRenderingContext2D, points: { x: number; y: number }[]) => {
    if (points.length < 2) return

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.stroke()
  }

  const drawRectangle = (
    ctx: CanvasRenderingContext2D,
    start: { x: number; y: number },
    end: { x: number; y: number },
  ) => {
    const width = end.x - start.x
    const height = end.y - start.y
    ctx.strokeRect(start.x, start.y, width, height)
  }

  const drawCircle = (
    ctx: CanvasRenderingContext2D,
    start: { x: number; y: number },
    end: { x: number; y: number },
  ) => {
    const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
    ctx.beginPath()
    ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI)
    ctx.stroke()
  }

  const drawLine = (ctx: CanvasRenderingContext2D, start: { x: number; y: number }, end: { x: number; y: number }) => {
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()
  }

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left - state.pan.x) / state.zoom,
      y: (e.clientY - rect.top - state.pan.y) / state.zoom,
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === "select") return

    const pos = getMousePos(e)
    setIsDrawing(true)
    setStartPoint(pos)
    setCurrentPath([pos])
    clearSelection()
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)

    if (isDrawing && selectedTool !== "select") {
      if (selectedTool === "pencil") {
        setCurrentPath((prev) => [...prev, pos])
      } else {
        setCurrentPath([pos])
      }
      redrawCanvas()
    }
  }

  const handleMouseUp = () => {
    if (!isDrawing || !startPoint || selectedTool === "select") return

    const endPoint = currentPath[currentPath.length - 1]

    let element: Omit<DrawingElement, "id">

    switch (selectedTool) {
      case "pencil":
        element = {
          type: "path",
          points: currentPath,
          style: {
            color: state.currentColor,
            strokeWidth: state.currentStrokeWidth,
          },
        }
        break
      case "rectangle":
        element = {
          type: "rectangle",
          points: [startPoint, endPoint],
          bounds: {
            x: Math.min(startPoint.x, endPoint.x),
            y: Math.min(startPoint.y, endPoint.y),
            width: Math.abs(endPoint.x - startPoint.x),
            height: Math.abs(endPoint.y - startPoint.y),
          },
          style: {
            color: state.currentColor,
            strokeWidth: state.currentStrokeWidth,
          },
        }
        break
      case "circle":
        const radius = Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2))
        element = {
          type: "circle",
          points: [startPoint, endPoint],
          bounds: {
            x: startPoint.x - radius,
            y: startPoint.y - radius,
            width: radius * 2,
            height: radius * 2,
          },
          style: {
            color: state.currentColor,
            strokeWidth: state.currentStrokeWidth,
          },
        }
        break
      case "line":
        element = {
          type: "line",
          points: [startPoint, endPoint],
          style: {
            color: state.currentColor,
            strokeWidth: state.currentStrokeWidth,
          },
        }
        break
      case "sticky":
        const text = prompt("Enter sticky note text:") || "New note"
        element = {
          type: "sticky",
          points: [startPoint],
          bounds: {
            x: startPoint.x,
            y: startPoint.y,
            width: 150,
            height: 100,
          },
          text,
          style: {
            color: state.currentColor,
            strokeWidth: state.currentStrokeWidth,
          },
        }
        break
      case "text":
        const textContent = prompt("Enter text:") || "New text"
        element = {
          type: "text",
          points: [startPoint],
          bounds: {
            x: startPoint.x,
            y: startPoint.y,
            width: textContent.length * 10,
            height: 20,
          },
          text: textContent,
          style: {
            color: state.currentColor,
            strokeWidth: state.currentStrokeWidth,
          },
        }
        break
      default:
        return
    }

    addElement(element)
    setIsDrawing(false)
    setCurrentPath([])
    setStartPoint(null)
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "z":
            e.preventDefault()
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
            break
          case "y":
            e.preventDefault()
            redo()
            break
          case "a":
            e.preventDefault()
            selectElements(state.elements.map((el) => el.id))
            break
        }
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (state.selectedElements.length > 0) {
          deleteElements(state.selectedElements)
        }
      }
    },
    [undo, redo, selectElements, deleteElements, state.elements, state.selectedElements],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // Handle tool actions
  useEffect(() => {
    switch (selectedTool) {
      case "undo":
        undo()
        break
      case "redo":
        redo()
        break
      case "zoom-in":
        setZoom(state.zoom * 1.2)
        break
      case "zoom-out":
        setZoom(state.zoom / 1.2)
        break
    }
  }, [selectedTool])

  const getCursorStyle = () => {
    switch (selectedTool) {
      case "pencil":
        return "cursor-crosshair"
      case "rectangle":
      case "circle":
      case "line":
        return "cursor-crosshair"
      case "text":
      case "sticky":
        return "cursor-text"
      case "eraser":
        return "cursor-pointer"
      case "hand":
        return "cursor-grab"
      default:
        return "cursor-default"
    }
  }

  return (
    <div className={`relative bg-white ${className}`}>
      {/* Canvas Controls */}
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <Button
          variant={showGrid ? "default" : "outline"}
          size="sm"
          onClick={() => setShowGrid(!showGrid)}
          className="h-8 px-3 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-gray-50"
        >
          <Grid3X3 className="w-4 h-4 mr-1" />
          Grid
        </Button>
        {state.selectedElements.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => deleteElements(state.selectedElements)}
            className="h-8 px-3 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        )}
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-600">
        {Math.round(state.zoom * 100)}%
      </div>

      {/* Main Canvas Container */}
      <div ref={containerRef} className="w-full h-full relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 ${getCursorStyle()}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Tool feedback */}
        {selectedTool !== "select" && (
          <div className="absolute top-4 left-4 bg-black/75 text-white px-2 py-1 rounded text-xs pointer-events-none">
            {selectedTool === "pencil" && "Pencil Tool - Click and drag to draw"}
            {selectedTool === "rectangle" && "Rectangle Tool - Click and drag to create rectangle"}
            {selectedTool === "circle" && "Circle Tool - Click and drag to create circle"}
            {selectedTool === "line" && "Line Tool - Click and drag to create line"}
            {selectedTool === "sticky" && "Sticky Note Tool - Click to add sticky note"}
            {selectedTool === "text" && "Text Tool - Click to add text"}
            {selectedTool === "eraser" && "Eraser Tool - Click elements to delete"}
          </div>
        )}
      </div>
    </div>
  )
}
