import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Aurafloor',
  description: 'Governing terms for the Aurafloor audio NFT marketplace.',
}

export default function TermsPage() {
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
            <h1 className="text-2xl sm:text-3xl font-bold">Terms of Service</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Platform rules and policies
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Terms of Service
            </CardTitle>
            <CardDescription>
              Last Updated: February 2026
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm sm:text-base">
            <div className="space-y-6">
              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">1. ACCEPTANCE OF TERMS</h2>
                <p className="text-muted-foreground">
                  By accessing or using Aurafloor (the &quot;Platform,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these Terms and Conditions (&quot;Terms&quot;). If you do not agree to these Terms, you must not access or use the Platform.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">2. DEFINITIONS</h2>
                <h3 className="font-semibold text-sm sm:text-base mt-4">2.1 Key Terms</h3>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>&quot;NFT&quot; means a unique, non-fungible token minted or recorded on a blockchain.</li>
                  <li>&quot;Audio Content&quot; means any audio file, podcast, musical recording, or sound recording linked to an NFT on the Platform.</li>
                  <li>&quot;Creator&quot; means a user who mints, lists, or sells an NFT on the Platform.</li>
                  <li>&quot;Collector&quot; means a user who purchases, acquires, or holds an NFT from the Platform.</li>
                  <li>&quot;User&quot; means any individual or entity accessing or using the Platform.</li>
                  <li>&quot;Smart Contract&quot; means the self-executing contract code deployed on a blockchain that governs the creation, transfer, and rules of an NFT.</li>
                  <li>&quot;Platform Balance&quot; means the amount of Pi added to the Platform wallet.</li>
                  <li>&quot;Intellectual Property Rights&quot; means all copyrights, trademarks, patents, trade secrets, moral rights, and other proprietary rights.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">3. ELIGIBILITY AND ACCOUNT</h2>
                <h3 className="font-semibold text-sm sm:text-base mt-4">3.1 Age Requirement</h3>
                <p className="text-muted-foreground">
                  You must be at least 18 years old to use the Platform. By using it, you represent and warrant that you meet this requirement.
                </p>
                <h3 className="font-semibold text-sm sm:text-base mt-4">3.2 Account Registration</h3>
                <p className="text-muted-foreground">
                  To use core features, you must connect a valid Pi Network cryptocurrency wallet. You are solely responsible for maintaining the security of your wallet, private keys, and account credentials, and for all activities conducted through your account.
                </p>
                <h3 className="font-semibold text-sm sm:text-base mt-4">3.3 Prohibited Jurisdictions</h3>
                <p className="text-muted-foreground">
                  You may not use the Platform if you are located in, or a resident of, any jurisdiction where the use of Pi network blockchain technology or NFT trading is prohibited or restricted by applicable law.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">4. CREATOR OBLIGATIONS</h2>
                <h3 className="font-semibold text-sm sm:text-base mt-4">4.1 Prohibited Content</h3>
                <p className="text-muted-foreground">
                  Creators must not mint NFTs containing Audio Content that: infringes IP rights; contains unauthorized samples or covers; is defamatory, harassing, or hateful; violates privacy/publicity rights; contains malware; promotes illegal activities; or contains sexually explicit material involving minors.
                </p>
                <h3 className="font-semibold text-sm sm:text-base mt-4">4.2 Verification</h3>
                <p className="text-muted-foreground">
                  The Platform may require additional verification for certain content, such as proof of mechanical licenses for cover songs or agreements from all collaborators.
                </p>
                <h3 className="font-semibold text-sm sm:text-base mt-4">4.3 Accurate Metadata</h3>
                <p className="text-muted-foreground">
                  Creators must provide accurate and complete metadata, including proper title, artist attribution, genre tags, and disclosures of samples or explicit content.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">5. FEES, ROYALTIES &amp; PAYMENTS</h2>
                <h3 className="font-semibold text-sm sm:text-base mt-4">5.1 Primary Sales</h3>
                <p className="text-muted-foreground">
                  On the initial sale of an NFT: Aurafloor charges a 10% platform fee. The Creator receives the remaining 90% of the sale price.
                </p>
                <h3 className="font-semibold text-sm sm:text-base mt-4">5.2 Secondary Sales</h3>
                <p className="text-muted-foreground">
                  On all subsequent resales: Aurafloor charges a 5% platform fee. A Creator royalty of 5-15% (as set by the Creator at minting) is automatically distributed. The seller receives the remainder.
                </p>
                <h3 className="font-semibold text-sm sm:text-base mt-4">5.3 Subscriptions</h3>
                <p className="text-muted-foreground">
                  5.3.1 Subscription Plans. Aurafloor may offer paid subscription plans (&quot;Subscriptions&quot;) that provide access to enhanced features. Details are specified on the Platform.<br />
                  5.3.2 Automatic Renewal. UNLESS YOU CANCEL BEFORE YOUR NEXT BILLING CYCLE, YOUR SUBSCRIPTION WILL AUTOMATICALLY RENEW, AND YOU AUTHORIZE US TO CHARGE THE APPLICABLE FEE.<br />
                  5.3.3 Cancellation. You may cancel your Subscription at any time through your account settings. Cancellation stops future renewals but does not refund fees for the current billing period.<br />
                  5.3.4 Changes. We reserve the right to modify Subscription fees or features with prior notice. Your continued use after such changes constitutes acceptance.
                </p>
                <h3 className="font-semibold text-sm sm:text-base mt-4">5.4 Payment Processing</h3>
                <p className="text-muted-foreground">
                  All transactions are processed on-chain via Smart Contracts. Platform fees and Creator royalties are automatically deducted and distributed. Users are solely responsible for paying all associated blockchain network fees (gas fees).
                </p>
                <h3 className="font-semibold text-sm sm:text-base mt-4">5.5 Taxes</h3>
                <p className="text-muted-foreground">
                  Users are solely responsible for determining, reporting, and paying any taxes applicable to their transactions on the Platform.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">6. BLOCKCHAIN &amp; SMART CONTRACT RISKS</h2>
                <h3 className="font-semibold text-sm sm:text-base mt-4">6.1 Acknowledgement</h3>
                <p className="text-muted-foreground">
                  You acknowledge that NFT transactions are governed by immutable Smart Contracts on public blockchains. The Platform does not control these networks and cannot reverse transactions.
                </p>
                <h3 className="font-semibold text-sm sm:text-base mt-4">6.2 Inherent Risks</h3>
                <p className="text-muted-foreground">
                  You accept risks including, but not limited to: Smart contract bugs; network congestion; lost private keys resulting in permanent asset loss; cryptocurrency volatility; and regulatory changes.
                </p>
                <h3 className="font-semibold text-sm sm:text-base mt-4">6.3 No Refunds</h3>
                <p className="text-muted-foreground">
                  All sales are final. Due to the nature of blockchain technology, the Platform cannot issue refunds for completed transactions.
                </p>
                <h3 className="font-semibold text-sm sm:text-base mt-4">6.4 Gas Fees</h3>
                <p className="text-muted-foreground">
                  You are responsible for all blockchain network/gas fees, which are non-refundable and vary based on network conditions.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">7. PLATFORM SERVICE</h2>
                <h3 className="font-semibold text-sm sm:text-base mt-4">7.1 Service Description</h3>
                <p className="text-muted-foreground">
                  We provide an NFT minting, marketplace, and streaming platform. We reserve the right to modify, suspend, or discontinue any service aspect at any time.
                </p>
                <h3 className="font-semibold text-sm sm:text-base mt-4">7.2 No Guarantee</h3>
                <p className="text-muted-foreground">
                  The Platform is provided &quot;as is&quot; and &quot;as available.&quot; We do not guarantee uninterrupted, secure, or error-free service.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">8. CONTENT MODERATION</h2>
                <p className="text-muted-foreground">
                  We reserve the right to remove any content or suspend any account that we believe, in our sole discretion, violates these Terms, is illegal, or is harmful to the Platform. Removal does not affect the underlying blockchain ownership of the NFT.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">9. USER CONDUCT</h2>
                <p className="text-muted-foreground">
                  You agree not to use the Platform to: violate laws; infringe rights; engage in fraud, wash trading, or market manipulation; upload malware; harass others; or attempt to gain unauthorized access. Violations may result in account termination, forfeiture of funds, and legal action.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">10. OTHER GOVERNING POLICIES</h2>
                <p className="text-muted-foreground">
                  Your use of the Platform is also governed by our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and our <Link href="/copyright" className="text-primary hover:underline">Copyright Policy</Link>, which are incorporated into these Terms by reference.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">11. DISCLAIMER OF WARRANTIES</h2>
                <p className="text-muted-foreground">
                  THE PLATFORM AND ALL CONTENT ARE PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT PROVIDE INVESTMENT, FINANCIAL, OR TAX ADVICE.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">12. LIMITATION OF LIABILITY</h2>
                <p className="text-muted-foreground">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY TO YOU SHALL NOT EXCEED THE GREATER OF $100 USD OR THE AMOUNT OF FEES YOU PAID TO US IN THE SIX MONTHS BEFORE THE CLAIM AROSE. WE ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">13. INDEMNIFICATION</h2>
                <p className="text-muted-foreground">
                  You agree to indemnify and hold Aurafloor, its affiliates, and their personnel harmless from any claims or damages arising from your use of the Platform, your breach of these Terms, or your Audio Content.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">14. DISPUTE RESOLUTION</h2>
                <h3 className="font-semibold text-sm sm:text-base mt-4">14.1 Governing Law</h3>
                <p className="text-muted-foreground">
                  These Terms are governed by the laws of South Africa, without regard to conflict of law principles.
                </p>
                <h3 className="font-semibold text-sm sm:text-base mt-4">14.2 Arbitration</h3>
                <p className="text-muted-foreground">
                  Any dispute shall be resolved by binding, individual arbitration in Johannesburg, South Africa, under the rules of the Arbitration Foundation of Southern Africa (AFSA).
                </p>
                <h3 className="font-semibold text-sm sm:text-base mt-4">14.3 Class Action Waiver</h3>
                <p className="text-muted-foreground">
                  YOU WAIVE THE RIGHT TO PARTICIPATE IN A CLASS ACTION, CLASS ARBITRATION, OR ANY OTHER REPRESENTATIVE PROCEEDING.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">15. TERMINATION</h2>
                <p className="text-muted-foreground">
                  We may suspend or terminate your access immediately for any breach of these Terms. You may stop using the Platform at any time. Provisions that by their nature should survive termination (including Payments, Disclaimers, Liability, and Indemnification) will survive.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">16. GENERAL</h2>
                <p className="text-muted-foreground">
                  These Terms constitute the entire agreement. We may amend them by posting a revised version; your continued use constitutes acceptance. If any part is held invalid, the remainder stays in effect. Our failure to enforce a right is not a waiver. You may not assign these Terms without our consent; we may assign freely.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">17. CONTACT</h2>
                <p className="text-muted-foreground">
                  For questions about these Terms, please contact:<br />
                  Email: legal@aurafloor.co.za<br />
                  Address: Johannesburg, South Africa
                </p>
              </section>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  If you have any questions, contact our support team at{" "}
                  <a href="mailto:legal@aurafloor.co.za" className="text-primary underline-offset-4 hover:underline">
                    legal@aurafloor.co.za
                  </a>
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
