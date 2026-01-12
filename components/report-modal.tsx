"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AlertTriangle, CheckCircle2 } from "lucide-react"

interface ReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contentType: "nft" | "post" | "comment" | "user"
  contentId: string
  contentTitle?: string
}

const reportReasons = {
  nft: [
    { value: "copyright", label: "Copyright Infringement" },
    { value: "inappropriate", label: "Inappropriate Content" },
    { value: "spam", label: "Spam or Misleading" },
    { value: "stolen", label: "Stolen/Unauthorized Content" },
    { value: "other", label: "Other" },
  ],
  post: [
    { value: "harassment", label: "Harassment or Bullying" },
    { value: "spam", label: "Spam" },
    { value: "inappropriate", label: "Inappropriate Content" },
    { value: "misinformation", label: "Misinformation" },
    { value: "other", label: "Other" },
  ],
  comment: [
    { value: "harassment", label: "Harassment or Bullying" },
    { value: "spam", label: "Spam" },
    { value: "inappropriate", label: "Inappropriate Content" },
    { value: "hate", label: "Hate Speech" },
    { value: "other", label: "Other" },
  ],
  user: [
    { value: "impersonation", label: "Impersonation" },
    { value: "harassment", label: "Harassment" },
    { value: "spam", label: "Spam Account" },
    { value: "fraud", label: "Fraudulent Activity" },
    { value: "other", label: "Other" },
  ],
}

export function ReportModal({ open, onOpenChange, contentType, contentId, contentTitle }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState("")
  const [details, setDetails] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedReason) return

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("[v0] Report submitted:", {
      contentType,
      contentId,
      reason: selectedReason,
      details,
    })

    setIsSubmitting(false)
    setSubmitted(true)

    // Reset after 2 seconds
    setTimeout(() => {
      setSubmitted(false)
      setSelectedReason("")
      setDetails("")
      onOpenChange(false)
    }, 2000)
  }

  const reasons = reportReasons[contentType]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        {!submitted ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                Report {contentType === "nft" ? "NFT" : contentType === "post" ? "Post" : contentType}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 sm:space-y-4">
              {contentTitle && (
                <div className="p-2.5 sm:p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium truncate">Reporting: {contentTitle}</p>
                </div>
              )}

              <div className="space-y-2 sm:space-y-3">
                <Label className="text-sm sm:text-base">Reason for report</Label>
                <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="space-y-2">
                  {reasons.map((reason) => (
                    <div key={reason.value} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-lg">
                      <RadioGroupItem 
                        value={reason.value} 
                        id={reason.value} 
                        className="h-4 w-4 sm:h-4 sm:w-4"
                      />
                      <Label 
                        htmlFor={reason.value} 
                        className="font-normal cursor-pointer text-sm sm:text-base flex-1"
                      >
                        {reason.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="details" className="text-sm sm:text-base">
                  Additional details (optional)
                </Label>
                <Textarea
                  id="details"
                  placeholder="Provide any additional context to help us review this report..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  className="min-h-[100px] text-sm sm:text-base resize-none"
                />
              </div>

              <div className="bg-muted/50 p-2.5 sm:p-3 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Your report will be reviewed by our moderation team. False reports may result in account restrictions.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)} 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleSubmit} 
                  disabled={!selectedReason || isSubmitting}
                  className="w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
                >
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-6 sm:py-8 text-center space-y-3 sm:space-y-4">
            <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Report Submitted</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Thank you for helping keep Aurafloor safe. We'll review your report shortly.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
