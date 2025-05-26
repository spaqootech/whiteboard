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
}

type DrawingAction =
  | { type: "ADD_ELEMENT"; element: DrawingElement }
  | { type: "UPDATE_ELEMENT"; id: string; updates: Partial<DrawingElement> }
  | { type: "DELETE_ELEMENTS"; ids: string[] }
  | { type: "SELECT_ELEMENTS"; ids: string[] }
  | { type: "CLEAR_SELECTION" }
  | { type: "SET_COLOR"; color: string }
  | { type: "SET_STROKE_WIDTH"; width: number }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SET_ZOOM"; zoom: number }
  | { type: "SET_PAN"; pan: { x: number; y: number } }
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
  deleteElements: (ids: string[]) => void
  selectElements: (ids: string[]) => void
  clearSelection: () => void
  setColor: (color: string) => void
  setStrokeWidth: (width: number) => void
  undo: () => void
  redo: () => void
  setZoom: (zoom: number) => void
  setPan: (pan: { x: number; y: number }) => void
  clearCanvas: () => void
  canUndo: boolean
  canRedo: boolean
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

  const clearCanvas = useCallback(() => {
    dispatch({ type: "CLEAR_CANVAS" })
  }, [])

  const canUndo = state.historyIndex > 0
  const canRedo = state.historyIndex < state.history.length - 1

  const value: DrawingContextType = {
    state,
    dispatch,
    addElement,
    updateElement,
    deleteElements,
    selectElements,
    clearSelection,
    setColor,
    setStrokeWidth,
    undo,
    redo,
    setZoom,
    setPan,
    clearCanvas,
    canUndo,
    canRedo,
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
