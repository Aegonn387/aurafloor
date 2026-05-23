import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, FileText, Download } from "lucide-react"
import Link from "next/link"
import { WHITEPAPER_CONTENT } from "@/lib/whitepaper-full"

export default function WhitepaperPage() {
  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-6">
      <Header />
      <main className="container px-4 py-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/fees"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Whitepaper</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Official Aurafloor Whitepaper v1.1 – May 2026</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Full Document</h2>
              <Button variant="outline" size="sm" asChild>
                <a href="/whitepaper.pdf" download><Download className="h-4 w-4 mr-2" />Download PDF</a>
              </Button>
            </div>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {WHITEPAPER_CONTENT.split('\\n').map((line, i) => (
                <p key={i} className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{line}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      <MobileNav />
    </div>
  )
}
