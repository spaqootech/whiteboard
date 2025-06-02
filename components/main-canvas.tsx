"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Grid3X3, Trash2, Move } from "lucide-react"
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
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null)
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([])
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [hoveredElement, setHoveredElement] = useState<string | null>(null)

  const {
    state,
    addElement,
    updateElement,
    updateElements,
    deleteElements,
    selectElements,
    clearSelection,
    setZoom,
    setPan,
    setDragOffset,
    undo,
    redo,
    getElementAt,
    commitDrag,
  } = useDrawing()

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
  }, [state.elements, state.selectedElements, state.zoom, state.pan, hoveredElement])

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
      const isSelected = state.selectedElements.includes(element.id)
      const isHovered = hoveredElement === element.id
      drawElement(ctx, element, isSelected, isHovered)
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
  }, [state, showGrid, isDrawing, currentPath, startPoint, selectedTool, hoveredElement])

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

  const drawElement = (
    ctx: CanvasRenderingContext2D,
    element: DrawingElement,
    isSelected: boolean,
    isHovered: boolean,
  ) => {
    ctx.strokeStyle = element.style.color
    ctx.lineWidth = element.style.strokeWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Add hover effect
    if (isHovered && (selectedTool === "select" || selectedTool === "eraser")) {
      ctx.shadowColor = selectedTool === "eraser" ? "rgba(239, 68, 68, 0.3)" : "rgba(59, 130, 246, 0.3)"
      ctx.shadowBlur = 8
    }

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

    // Reset shadow
    ctx.shadowColor = "transparent"
    ctx.shadowBlur = 0

    // Draw selection indicator
    if (isSelected) {
      drawSelectionIndicator(ctx, element)
    }

    // Draw eraser indicator
    if (isHovered && selectedTool === "eraser") {
      ctx.strokeStyle = "#ef4444"
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5])
      if (element.bounds) {
        ctx.strokeRect(element.bounds.x - 2, element.bounds.y - 2, element.bounds.width + 4, element.bounds.height + 4)
      }
      ctx.setLineDash([])
    }
  }

  const drawSelectionIndicator = (ctx: CanvasRenderingContext2D, element: DrawingElement) => {
    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])

    if (element.bounds) {
      // Draw selection rectangle
      ctx.strokeRect(element.bounds.x - 5, element.bounds.y - 5, element.bounds.width + 10, element.bounds.height + 10)

      // Draw resize handles
      ctx.setLineDash([])
      ctx.fillStyle = "#3b82f6"
      const handleSize = 6
      const handles = [
        { x: element.bounds.x - 5, y: element.bounds.y - 5 }, // Top-left
        { x: element.bounds.x + element.bounds.width + 5 - handleSize, y: element.bounds.y - 5 }, // Top-right
        { x: element.bounds.x - 5, y: element.bounds.y + element.bounds.height + 5 - handleSize }, // Bottom-left
        {
          x: element.bounds.x + element.bounds.width + 5 - handleSize,
          y: element.bounds.y + element.bounds.height + 5 - handleSize,
        }, // Bottom-right
      ]

      handles.forEach((handle) => {
        ctx.fillRect(handle.x, handle.y, handleSize, handleSize)
      })
    } else if (element.type === "path" || element.type === "line") {
      // For paths and lines, draw selection around the path
      const bounds = getPathBounds(element.points)
      if (bounds) {
        ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10)
      }
    }

    ctx.setLineDash([])
  }

  const getPathBounds = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return null

    let minX = points[0].x
    let maxX = points[0].x
    let minY = points[0].y
    let maxY = points[0].y

    points.forEach((point) => {
      minX = Math.min(minX, point.x)
      maxX = Math.max(maxX, point.x)
      minY = Math.min(minY, point.y)
      maxY = Math.max(maxY, point.y)
    })

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
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
    const pos = getMousePos(e)

    if (selectedTool === "select") {
      const elementAtPos = getElementAt(pos.x, pos.y)

      if (elementAtPos) {
        // Start dragging
        if (!state.selectedElements.includes(elementAtPos.id)) {
          selectElements([elementAtPos.id])
        }
        setIsDragging(true)
        setDragStartPos(pos)
        setDragOffset({ x: 0, y: 0 })
      } else {
        // Clear selection if clicking on empty space
        clearSelection()
      }
      return
    }

    if (selectedTool === "eraser") {
      const elementAtPos = getElementAt(pos.x, pos.y)
      if (elementAtPos) {
        deleteElements([elementAtPos.id])
      }
      return
    }

    // Drawing mode
    setIsDrawing(true)
    setStartPoint(pos)
    setCurrentPath([pos])
    clearSelection()
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)

    if (selectedTool === "select" || selectedTool === "eraser") {
      // Handle hover effects
      const elementAtPos = getElementAt(pos.x, pos.y)
      setHoveredElement(elementAtPos?.id || null)

      // Handle dragging (only for select tool)
      if (selectedTool === "select" && isDragging && dragStartPos && state.selectedElements.length > 0) {
        const deltaX = pos.x - dragStartPos.x
        const deltaY = pos.y - dragStartPos.y

        // Update selected elements positions
        const updates = state.selectedElements.map((id) => {
          const element = state.elements.find((el) => el.id === id)
          if (!element) return { id, updates: {} }

          const elementUpdates: Partial<DrawingElement> = {}

          if (element.bounds) {
            elementUpdates.bounds = {
              ...element.bounds,
              x: element.bounds.x + deltaX - state.dragOffset.x,
              y: element.bounds.y + deltaY - state.dragOffset.y,
            }
          }

          if (element.points) {
            elementUpdates.points = element.points.map((point) => ({
              x: point.x + deltaX - state.dragOffset.x,
              y: point.y + deltaY - state.dragOffset.y,
            }))
          }

          return { id, updates: elementUpdates }
        })

        updateElements(updates)
        setDragOffset({ x: deltaX, y: deltaY })
      }
    } else if (isDrawing) {
      // Drawing mode
      if (selectedTool === "pencil") {
        setCurrentPath((prev) => [...prev, pos])
      } else {
        setCurrentPath([pos])
      }
      redrawCanvas()
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)
      setDragStartPos(null)
      setDragOffset({ x: 0, y: 0 })
      commitDrag()
      return
    }

    if (!isDrawing || !startPoint || selectedTool === "select" || selectedTool === "eraser") return

    const endPoint = currentPath[currentPath.length - 1]

    let element: Omit<DrawingElement, "id">

    switch (selectedTool) {
      case "pencil":
        const bounds = getPathBounds(currentPath)
        element = {
          type: "path",
          points: currentPath,
          bounds: bounds
            ? {
                x: bounds.x - 5,
                y: bounds.y - 5,
                width: bounds.width + 10,
                height: bounds.height + 10,
              }
            : undefined,
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
        const lineBounds = getPathBounds([startPoint, endPoint])
        element = {
          type: "line",
          points: [startPoint, endPoint],
          bounds: lineBounds
            ? {
                x: lineBounds.x - 5,
                y: lineBounds.y - 5,
                width: lineBounds.width + 10,
                height: lineBounds.height + 10,
              }
            : undefined,
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
    if (selectedTool === "select") {
      if (hoveredElement) {
        return "cursor-move"
      }
      return "cursor-default"
    }

    if (selectedTool === "eraser") {
      return "cursor-pointer"
    }

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

      {/* Selection Info */}
      {state.selectedElements.length > 0 && (
        <div className="absolute top-4 left-4 z-10 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-sm">
          <div className="flex items-center space-x-2">
            <Move className="w-4 h-4 text-blue-600" />
            <span className="text-blue-800 font-medium">
              {state.selectedElements.length} element{state.selectedElements.length !== 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="text-xs text-blue-600 mt-1">Drag to move • Delete to remove</div>
        </div>
      )}

      {/* Eraser Info */}
      {selectedTool === "eraser" && hoveredElement && (
        <div className="absolute top-4 left-4 z-10 bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm">
          <div className="flex items-center space-x-2">
            <Trash2 className="w-4 h-4 text-red-600" />
            <span className="text-red-800 font-medium">Click to erase element</span>
          </div>
        </div>
      )}

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
            {selectedTool === "eraser" && "Eraser Tool - Click elements to delete them"}
          </div>
        )}
      </div>
    </div>
  )
}
