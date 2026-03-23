import Link from "next/link";
import { useAppSettings } from "@/providers/app-settings-provider";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { GraduationCap, ArrowRight } from "lucide-react";

export function HeroSection() {
  const { dictionary } = useAppSettings();

  return (
    <section className="bg-linear-to-b from-app-bg to-app-surface py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <Badge className="mb-4">{dictionary.landing.hero.badge}</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
            {dictionary.landing.hero.title}
          </h1>
          <p className="text-xl text-app-text-muted mb-8">
            {dictionary.landing.hero.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg">
                {dictionary.landing.hero.startFree}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg">
              {dictionary.landing.hero.watchDemo}
            </Button>
          </div>
          <p className="text-sm text-app-text-soft mt-4">
            {dictionary.landing.hero.noCard}
          </p>
        </div>

        {/* Hero Image/Mockup */}
        <div className="mt-16 relative">
          <div className="bg-linear-to-r from-primary to-accent rounded-xl p-1 border-4">
            <div className="bg-app-surface rounded-lg p-8">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="h-3 bg-app-border rounded" />
                <div className="h-3 bg-app-border rounded" />
                <div className="h-3 bg-app-border rounded" />
              </div>
              <div className="h-48 bg-(--color-primary)/10 border border-app-border bg-linear-to-br from-primary-soft to-accent-soft rounded-lg flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-(--color-primary)/20 backdrop-blur-sm flex items-center justify-center">
                  <GraduationCap className="w-20 h-20 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
