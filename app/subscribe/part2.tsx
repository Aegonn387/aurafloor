// @ts-nocheck
// @ts-ignore
        {user?.role !== "creator" && (
          <div className="grid md:grid-cols-2 gap-6">
            {collectorPlans.map((plan) => (
              // @ts-ignore
              <Card key={plan.id} className={plan.recommended ? "border-accent shadow-lg" : ""}>
                {plan.recommended && (
                  <div className="bg-accent text-accent-foreground text-center py-2 rounded-t-lg">
                    <span className="text-sm font-semibold">Most Popular</span>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        {plan.name}
                      </CardTitle>
                      <CardDescription>Perfect for music collectors and enthusiasts</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">{plan.price}π</div>
                      <div className="text-sm text-muted-foreground">per {plan.period}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle2 className={`w-5 h-5 shrink-0 ${plan.recommended ? "text-accent" : "text-primary"}`} />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    variant={plan.recommended ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.name, plan.price)}
                    disabled={loading}
                  >
                    {loading && selectedPlan === plan.name ? "Processing..." : "Subscribe Now"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
