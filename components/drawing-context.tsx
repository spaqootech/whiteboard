"use client"

import type React from "react"
import { createContext, useContext, useReducer, useCallback } from "react"

export interface DrawingElement {
  id: string
  type: "path" | "rectangle" | "circle" | "line" | "text" | "sticky"
  points: { x: number; y: number }[]
  style: {
    color: string
    strokeWidth: number
    fill?: string
  }
  text?: string
  bounds?: { x: number; y: number; width: number; height: number }
  isDragging?: boolean
}

interface DrawingState {
  elements: DrawingElement[]
  selectedElements: string[]
  history: DrawingElement[][]
  historyIndex: number
  currentColor: string
  currentStrokeWidth: number
  zoom: number
  pan: { x: number; y: number }
  dragOffset: { x: number; y: number }
}

type DrawingAction =
  | { type: "ADD_ELEMENT"; element: DrawingElement }
  | { type: "UPDATE_ELEMENT"; id: string; updates: Partial<DrawingElement> }
  | { type: "UPDATE_ELEMENTS"; updates: { id: string; updates: Partial<DrawingElement> }[] }
  | { type: "DELETE_ELEMENTS"; ids: string[] }
  | { type: "SELECT_ELEMENTS"; ids: string[] }
  | { type: "CLEAR_SELECTION" }
  | { type: "SET_COLOR"; color: string }
  | { type: "SET_STROKE_WIDTH"; width: number }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SET_ZOOM"; zoom: number }
  | { type: "SET_PAN"; pan: { x: number; y: number } }
  | { type: "SET_DRAG_OFFSET"; offset: { x: number; y: number } }
  | { type: "CLEAR_CANVAS" }

const initialState: DrawingState = {
  elements: [],
  selectedElements: [],
  history: [[]],
  historyIndex: 0,
  currentColor: "#000000",
  currentStrokeWidth: 2,
  zoom: 1,
  pan: { x: 0, y: 0 },
  dragOffset: { x: 0, y: 0 },
}

function drawingReducer(state: DrawingState, action: DrawingAction): DrawingState {
  switch (action.type) {
    case "ADD_ELEMENT":
      const newElements = [...state.elements, action.element]
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push(newElements)
      return {
        ...state,
        elements: newElements,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }

    case "UPDATE_ELEMENT":
      const updatedElements = state.elements.map((el) => (el.id === action.id ? { ...el, ...action.updates } : el))
      return { ...state, elements: updatedElements }

    case "UPDATE_ELEMENTS":
      let elementsToUpdate = [...state.elements]
      action.updates.forEach(({ id, updates }) => {
        elementsToUpdate = elementsToUpdate.map((el) => (el.id === id ? { ...el, ...updates } : el))
      })
      return { ...state, elements: elementsToUpdate }

    case "DELETE_ELEMENTS":
      const filteredElements = state.elements.filter((el) => !action.ids.includes(el.id))
      const deleteHistory = state.history.slice(0, state.historyIndex + 1)
      deleteHistory.push(filteredElements)
      return {
        ...state,
        elements: filteredElements,
        selectedElements: [],
        history: deleteHistory,
        historyIndex: deleteHistory.length - 1,
      }

    case "SELECT_ELEMENTS":
      return { ...state, selectedElements: action.ids }

    case "CLEAR_SELECTION":
      return { ...state, selectedElements: [] }

    case "SET_COLOR":
      return { ...state, currentColor: action.color }

    case "SET_STROKE_WIDTH":
      return { ...state, currentStrokeWidth: action.width }

    case "UNDO":
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1
        return {
          ...state,
          elements: state.history[newIndex],
          historyIndex: newIndex,
          selectedElements: [],
        }
      }
      return state

    case "REDO":
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1
        return {
          ...state,
          elements: state.history[newIndex],
          historyIndex: newIndex,
          selectedElements: [],
        }
      }
      return state

    case "SET_ZOOM":
      return { ...state, zoom: Math.max(0.1, Math.min(5, action.zoom)) }

    case "SET_PAN":
      return { ...state, pan: action.pan }

    case "SET_DRAG_OFFSET":
      return { ...state, dragOffset: action.offset }

    case "CLEAR_CANVAS":
      const clearHistory = state.history.slice(0, state.historyIndex + 1)
      clearHistory.push([])
      return {
        ...state,
        elements: [],
        selectedElements: [],
        history: clearHistory,
        historyIndex: clearHistory.length - 1,
      }

    default:
      return state
  }
}

interface DrawingContextType {
  state: DrawingState
  dispatch: React.Dispatch<DrawingAction>
  addElement: (element: Omit<DrawingElement, "id">) => void
  updateElement: (id: string, updates: Partial<DrawingElement>) => void
  updateElements: (updates: { id: string; updates: Partial<DrawingElement> }[]) => void
  deleteElements: (ids: string[]) => void
  selectElements: (ids: string[]) => void
  clearSelection: () => void
  setColor: (color: string) => void
  setStrokeWidth: (width: number) => void
  undo: () => void
  redo: () => void
  setZoom: (zoom: number) => void
  setPan: (pan: { x: number; y: number }) => void
  setDragOffset: (offset: { x: number; y: number }) => void
  clearCanvas: () => void
  canUndo: boolean
  canRedo: boolean
  getElementAt: (x: number, y: number) => DrawingElement | null
  commitDrag: () => void
}

const DrawingContext = createContext<DrawingContextType | null>(null)

export function DrawingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(drawingReducer, initialState)

  const addElement = useCallback((element: Omit<DrawingElement, "id">) => {
    const newElement: DrawingElement = {
      ...element,
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    dispatch({ type: "ADD_ELEMENT", element: newElement })
  }, [])

  const updateElement = useCallback((id: string, updates: Partial<DrawingElement>) => {
    dispatch({ type: "UPDATE_ELEMENT", id, updates })
  }, [])

  const updateElements = useCallback((updates: { id: string; updates: Partial<DrawingElement> }[]) => {
    dispatch({ type: "UPDATE_ELEMENTS", updates })
  }, [])

  const deleteElements = useCallback((ids: string[]) => {
    dispatch({ type: "DELETE_ELEMENTS", ids })
  }, [])

  const selectElements = useCallback((ids: string[]) => {
    dispatch({ type: "SELECT_ELEMENTS", ids })
  }, [])

  const clearSelection = useCallback(() => {
    dispatch({ type: "CLEAR_SELECTION" })
  }, [])

  const setColor = useCallback((color: string) => {
    dispatch({ type: "SET_COLOR", color })
  }, [])

  const setStrokeWidth = useCallback((width: number) => {
    dispatch({ type: "SET_STROKE_WIDTH", width })
  }, [])

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" })
  }, [])

  const redo = useCallback(() => {
    dispatch({ type: "REDO" })
  }, [])

  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: "SET_ZOOM", zoom })
  }, [])

  const setPan = useCallback((pan: { x: number; y: number }) => {
    dispatch({ type: "SET_PAN", pan })
  }, [])

  const setDragOffset = useCallback((offset: { x: number; y: number }) => {
    dispatch({ type: "SET_DRAG_OFFSET", offset })
  }, [])

  const clearCanvas = useCallback(() => {
    dispatch({ type: "CLEAR_CANVAS" })
  }, [])

  const getElementAt = useCallback(
    (x: number, y: number): DrawingElement | null => {
      // Check elements in reverse order (top to bottom)
      for (let i = state.elements.length - 1; i >= 0; i--) {
        const element = state.elements[i]

        if (element.bounds) {
          const { x: ex, y: ey, width, height } = element.bounds
          if (x >= ex && x <= ex + width && y >= ey && y <= ey + height) {
            return element
          }
        } else if (element.type === "path") {
          // For paths, check if point is near any line segment
          for (let j = 0; j < element.points.length - 1; j++) {
            const p1 = element.points[j]
            const p2 = element.points[j + 1]
            const distance = distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y)
            if (distance <= element.style.strokeWidth + 5) {
              return element
            }
          }
        } else if (element.type === "line" && element.points.length >= 2) {
          const p1 = element.points[0]
          const p2 = element.points[1]
          const distance = distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y)
          if (distance <= element.style.strokeWidth + 5) {
            return element
          }
        }
      }
      return null
    },
    [state.elements],
  )

  const commitDrag = useCallback(() => {
    const newHistory = state.history.slice(0, state.historyIndex + 1)
    newHistory.push([...state.elements])
    dispatch({
      type: "UPDATE_ELEMENTS",
      updates: [
        {
          id: "history",
          updates: {},
        },
      ],
    })
  }, [state.elements, state.history, state.historyIndex])

  const canUndo = state.historyIndex > 0
  const canRedo = state.historyIndex < state.history.length - 1

  const value: DrawingContextType = {
    state,
    dispatch,
    addElement,
    updateElement,
    updateElements,
    deleteElements,
    selectElements,
    clearSelection,
    setColor,
    setStrokeWidth,
    undo,
    redo,
    setZoom,
    setPan,
    setDragOffset,
    clearCanvas,
    canUndo,
    canRedo,
    getElementAt,
    commitDrag,
  }

  return <DrawingContext.Provider value={value}>{children}</DrawingContext.Provider>
}

export function useDrawing() {
  const context = useContext(DrawingContext)
  if (!context) {
    throw new Error("useDrawing must be used within a DrawingProvider")
  }
  return context
}

// Helper function to calculate distance from point to line segment
function distanceToLineSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const A = px - x1
  const B = py - y1
  const C = x2 - x1
  const D = y2 - y1

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1
  if (lenSq !== 0) {
    param = dot / lenSq
  }

  let xx: number, yy: number

  if (param < 0) {
    xx = x1
    yy = y1
  } else if (param > 1) {
    xx = x2
    yy = y2
  } else {
    xx = x1 + param * C
    yy = y1 + param * D
  }

  const dx = px - xx
  const dy = py - yy
  return Math.sqrt(dx * dx + dy * dy)
}
