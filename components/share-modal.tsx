"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, Mail, UserPlus, X } from "lucide-react"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const [email, setEmail] = useState("")
  const [permission, setPermission] = useState("edit")
  const [collaborators, setCollaborators] = useState([
    { email: "alex@example.com", permission: "edit", status: "active" },
    { email: "sarah@example.com", permission: "view", status: "pending" },
  ])

  const shareLink = "https://whiteboard.app/share/abc123xyz"

  const handleInvite = () => {
    if (email) {
      setCollaborators([...collaborators, { email, permission, status: "pending" }])
      setEmail("")
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            Share Whiteboard
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share Link */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Share Link</Label>
            <div className="flex space-x-2">
              <Input value={shareLink} readOnly className="flex-1 bg-gray-50" />
              <Button variant="outline" size="icon" onClick={copyLink} className="shrink-0">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">Anyone with this link can view the whiteboard</p>
          </div>

          <Separator />

          {/* Invite by Email */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Invite Collaborators</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite} size="sm">
                <Mail className="w-4 h-4 mr-1" />
                Invite
              </Button>
            </div>
          </div>

          {/* Current Collaborators */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Current Collaborators</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {collaborators.map((collaborator, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{collaborator.email}</span>
                    <Badge variant={collaborator.status === "active" ? "default" : "secondary"} className="text-xs">
                      {collaborator.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select value={collaborator.permission}>
                      <SelectTrigger className="w-20 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="edit">Edit</SelectItem>
                        <SelectItem value="view">View</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7"
                      onClick={() => setCollaborators(collaborators.filter((_, i) => i !== index))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
