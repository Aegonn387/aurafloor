import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Aurafloor',
  description: 'How Aurafloor handles data on its Pi-powered audio NFT marketplace.',
}

export default function PrivacyPage() {
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
            <h1 className="text-2xl sm:text-3xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              How we handle your data on Aurafloor
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Privacy Policy
            </CardTitle>
            <CardDescription>
              Last Updated: February 2026
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm sm:text-base">
            <div className="space-y-6">
              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">1. Introduction</h2>
                <p className="text-muted-foreground">
                  Aurafloor (&quot;we,&quot; &quot;our,&quot; or &quot;Platform&quot;) is committed to transparency regarding the collection and use of information on our Pi-powered audio NFT marketplace. This Privacy Policy explains what data we collect, how we use it, and your rights. By using Aurafloor, you agree to these practices.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">2. Information We Collect</h2>
                <p className="text-muted-foreground">
                  Our data collection is minimal and focused on enabling core blockchain and marketplace functionalities:
                </p>
                <p className="text-muted-foreground">
                  • <strong>Blockchain-Powered Identity:</strong> Your Pi Network wallet address and associated public blockchain username.<br />
                  • <strong>On-Chain Transaction Data:</strong> Data related to your Platform activity (minting, buying, selling) visible on the Pi blockchain.<br />
                  • <strong>Platform Interaction Data:</strong> Analytics on streaming, NFT performance, and user activity <strong>solely for our integrated Pi Ads system.</strong>
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">3. How We Use Your Information</h2>
                <p className="text-muted-foreground">
                  • <strong>To Provide Core Services:</strong> Facilitate transactions, distribute royalties via Smart Contracts, and ensure security.<br />
                  • <strong>To Drive the Pi Ads Engine:</strong> Analyze aggregated data to power internal promotions and serve relevant ads <strong>exclusively within Aurafloor. We do not share this data with external ad networks.</strong><br />
                  • <strong>To Improve the Platform:</strong> Understand feature usage and guide development.<br />
                  • <strong>To Comply with Law:</strong> Meet legal obligations.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">4. How We Share Information</h2>
                <p className="text-muted-foreground">
                  We do not sell your personal data. We share information only:
                </p>
                <p className="text-muted-foreground">
                  • <strong>Inherently with the Blockchain:</strong> Your wallet address and transactions are public on the Pi blockchain.<br />
                  • <strong>With Service Providers:</strong> Trusted vendors for hosting and security (under strict contracts).<br />
                  • <strong>For Legal Reasons:</strong> If required by law.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">5. Your Rights &amp; Choices</h2>
                <p className="text-muted-foreground">
                  Given the decentralized nature of blockchain data:
                </p>
                <p className="text-muted-foreground">
                  • <strong>Access &amp; Portability:</strong> View on-chain activity via a blockchain explorer. <strong>Download your platform data (profile, interaction history) from your account settings.</strong><br />
                  • <strong>Correction:</strong> Update profile info in settings. On-chain data is immutable.<br />
                  • <strong>Opt-Out of Marketing:</strong> Control notifications in settings.<br />
                  • <strong>Account Deletion:</strong> Request deactivation. This removes profile data from our databases, not from the blockchain.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">6. Data Retention</h2>
                <p className="text-muted-foreground">
                  • <strong>On-Chain Data:</strong> Permanent and immutable.<br />
                  • <strong>Platform Data:</strong> Retained while your account is active and for up to three years after inactivity for analysis.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">7. Security</h2>
                <p className="text-muted-foreground">
                  We implement robust security measures. However, <strong>you are responsible for your Pi wallet security</strong> (e.g., protecting private keys).
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">8. Children&apos;s Privacy</h2>
                <p className="text-muted-foreground">
                  Our Platform is not intended for individuals under 18.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">9. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this policy. The &quot;Last Updated&quot; date will reflect changes.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">10. Contact Us</h2>
                <p className="text-muted-foreground">
                  For questions about this Privacy Policy, contact:<br />
                  <strong>Email:</strong> legal@aurafloor.co.za<br />
                  <strong>Address:</strong> Johannesburg, South Africa
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </main>

      <MobileNav />
    </div>
  )
}
