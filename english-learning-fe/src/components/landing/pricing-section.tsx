import Link from "next/link";
import { useAppSettings } from "@/providers/app-settings-provider";
import { Button } from "../ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { pricingPlans } from "@/mock-data/landing";
import { getNestedValue } from "@/utils/object";
import { CheckCircle, Crown, Zap } from "lucide-react";

export function PricingSection() {
  const { dictionary } = useAppSettings();

  return (
    <section id="pricing" className="py-20 bg-app-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-app-text">
            {dictionary.landing.pricing.title}
          </h2>
          <p className="text-xl text-app-text-muted">
            {dictionary.landing.pricing.description}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.nameKey}
              className={`relative ${
                plan.popular
                  ? "border-2 border-primary shadow-lg scale-105"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-(--color-primary)">
                    {dictionary.landing.pricing.mostPopular}
                  </Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-2xl text-(--color-text)">
                    {getNestedValue(dictionary, plan.nameKey)}
                  </CardTitle>
                  {getNestedValue(dictionary, plan.nameKey) ===
                    "Enterprise" && (
                    <Crown className="w-5 h-5 text-(--color-accent)" />
                  )}
                  {getNestedValue(dictionary, plan.nameKey) === "Pro" && (
                    <Zap className="w-5 h-5 text-(--color-primary)" />
                  )}
                </div>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-app-text">
                    {getNestedValue(dictionary, plan.priceKey)}
                  </span>
                  <span className="text-app-text-muted ml-2">
                    {getNestedValue(dictionary, plan.periodKey)}
                  </span>
                </div>
                <CardDescription className="text-app-text-muted">
                  {getNestedValue(dictionary, plan.descriptionKey)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {(
                    getNestedValue<string[]>(dictionary, plan.featuresKeys) ||
                    []
                  ).map((feature: string) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-(--color-success) shrink-0 mt-0.5" />
                      <span className="text-sm text-app-text">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard">
                  <Button
                    className="w-full"
                    variant={plan.popular ? "primary" : "outline"}
                  >
                    {getNestedValue(dictionary, plan.ctaKey)}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
