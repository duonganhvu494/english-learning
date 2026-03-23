import Link from "next/link";
import { useAppSettings } from "@/providers/app-settings-provider";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  const { dictionary } = useAppSettings();

  return (
    <section className="py-20 bg-linear-to-r from-(--color-primary) to-(--color-accent)">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold text-(--color-text-inverse) mb-6">
          {dictionary.landing.cta.title}
        </h2>
        <p className="text-xl text-(--color-primary-soft) mb-8">
          {dictionary.landing.cta.description}
        </p>
        <Link href="/dashboard">
          <Button
            size="lg"
            className="bg-(--color-text-inverse) text-(--color-primary) hover:bg-app-border text-lg"
          >
            {dictionary.landing.cta.startTrial}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
