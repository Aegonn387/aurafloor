import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Copyright & Intellectual Property Policy | Aurafloor',
  description: 'IP licenses, creator warranties, and copyright dispute procedures for Aurafloor.',
}

export default function CopyrightPage() {
  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-6">
      <Header />
      
      <main className="container px-4 py-6 space-y-6 max-w-4xl mx-auto">
        {/* Page header with back button */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Copyright & Intellectual Property Policy</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              IP licenses, creator warranties, and dispute procedures
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Copyright & Intellectual Property Policy
            </CardTitle>
            <CardDescription>
              Last Updated: February 2026
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm sm:text-base">
            <div className="space-y-6">
              <p className="text-muted-foreground">
                This Copyright & Intellectual Property Policy (&quot;IP Policy&quot;) is incorporated into the Aurafloor Terms of Service. It details the intellectual property rules, licenses, and dispute procedures for our Platform.
              </p>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">1. INTELLECTUAL PROPERTY OWNERSHIP PRINCIPLE</h2>
                <p className="text-muted-foreground">
                  Purchasing an NFT on Aurafloor confers ownership of the unique digital token recorded on the blockchain. Unless explicitly granted in writing, it does <strong>not</strong> transfer the copyright or intellectual property rights of the underlying Audio Content, which are retained by the Creator.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">2. CREATOR REPRESENTATIONS AND WARRANTIES</h2>
                <p className="text-muted-foreground">
                  By minting an NFT, you (the Creator) represent, warrant, and covenant that:
                </p>
                <p className="text-muted-foreground">
                  a) You are the sole owner of all Intellectual Property Rights in the Audio Content, OR you have obtained all necessary licenses, permissions, and clearances to:<br />
                  &nbsp;&nbsp;i) mint it as an NFT,<br />
                  &nbsp;&nbsp;ii) grant the licenses herein, and<br />
                  &nbsp;&nbsp;iii) distribute it on Aurafloor.
                </p>
                <p className="text-muted-foreground">
                  b) The Audio Content does not infringe any third-party rights, contain unlicensed samples, or violate any law.
                </p>
                <p className="text-muted-foreground">
                  c) You have obtained all required permissions from co-creators, featured artists, sample rights holders, performing rights organizations (PROs), labels, or publishers.
                </p>
                <p className="text-muted-foreground">
                  d) You have full authority to enter this agreement and grant the stated licenses.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">3. LICENSE TO NFT HOLDER</h2>
                <p className="text-muted-foreground">
                  Upon a valid purchase, the Collector receives a worldwide, perpetual, non-exclusive, non-sublicensable, non-transferable (except with the NFT) license to:
                </p>
                <p className="text-muted-foreground">
                  a) Stream and download the Audio Content for personal, non-commercial use.<br />
                  b) Display the NFT and its associated artwork in personal digital galleries, wallets, or marketplaces for the purpose of resale.<br />
                  c) Resell or transfer the NFT on the Platform, at which point this license transfers automatically to the new holder.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">4. RIGHTS NOT GRANTED TO COLLECTOR</h2>
                <p className="text-muted-foreground">
                  The Collector does NOT receive: Copyright ownership; rights to create derivative works, remixes, or adaptations; commercial exploitation rights (e.g., sync, public performance, broadcasting); exclusive rights; or the right to mint new NFTs of the same content.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">5. CREATOR&apos;S RETAINED RIGHTS</h2>
                <p className="text-muted-foreground">
                  Creators retain all Intellectual Property Rights in the original Audio Content, including the rights to commercial exploitation, creating derivatives, and licensing to third parties.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">6. LICENSE TO PLATFORM</h2>
                <p className="text-muted-foreground">
                  By uploading Audio Content, you grant Aurafloor a worldwide, non-exclusive, royalty-free license to host, store, display, stream, and use the content (including creating promotional clips) to operate, promote, and improve the Platform for as long as the NFT is listed.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">7. COPYRIGHT INFRINGEMENT &amp; DMCA PROCEDURES</h2>
                
                <h3 className="font-semibold text-sm sm:text-base mt-4">7.1 DMCA Takedown Notices</h3>
                <p className="text-muted-foreground">
                  Aurafloor respects intellectual property rights and complies with the Digital Millennium Copyright Act (&quot;DMCA&quot;). If you believe content on our Platform infringes your copyright, send a written notice to our designated agent with:<br />
                  • Your contact information.<br />
                  • Identification of the copyrighted work.<br />
                  • Identification of the infringing material (e.g., NFT link).<br />
                  • A statement of good faith belief.<br />
                  • A statement under penalty of perjury that the information is accurate.<br />
                  • Your physical or electronic signature.
                </p>

                <h3 className="font-semibold text-sm sm:text-base mt-4">7.2 Counter-Notice Procedure</h3>
                <p className="text-muted-foreground">
                  If you believe your content was removed in error, you may submit a counter-notification containing your contact details, identification of the removed content, a statement under penalty of perjury of good faith, and consent to jurisdiction. If valid, the content may be reinstated after 10-14 business days unless the claimant files a court action.
                </p>

                <h3 className="font-semibold text-sm sm:text-base mt-4">7.3 Repeat Infringers</h3>
                <p className="text-muted-foreground">
                  We will terminate the accounts of users who are repeat infringers of intellectual property rights.
                </p>

                <h3 className="font-semibold text-sm sm:text-base mt-4">7.4 Indemnification for IP Claims</h3>
                <p className="text-muted-foreground">
                  Creators agree to indemnify and hold Aurafloor harmless from any claims, damages, or losses arising from a breach of their IP warranties or infringement claims related to their Audio Content.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">8. CONTACT FOR COPYRIGHT MATTERS</h2>
                <p className="text-muted-foreground">
                  Please direct DMCA notices and copyright inquiries to our designated agent:<br />
                  <strong>Email:</strong> copyright@aurafloor.co.za<br />
                  <strong>Address:</strong> Johannesburg, South Africa
                </p>
              </section>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  This IP Policy is part of and governed by the Aurafloor <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <MobileNav />
    </div>
  )
}
