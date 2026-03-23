import { useAppSettings } from "@/providers/app-settings-provider";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { features } from "@/mock-data/landing";
import { getNestedValue } from "@/utils/object";

export function FeaturesSection() {
  const { dictionary } = useAppSettings();

  return (
    <section id="features" className="py-20 bg-app-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-app-text">
            {dictionary.landing.features.title}
          </h2>
          <p className="text-xl text-app-text-muted">
            {dictionary.landing.features.description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.titleKey}
                className="border-2 hover:border-(--color-primary) transition-colors"
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-(--color-primary-soft) rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-(--color-primary)" />
                  </div>
                  <CardTitle className="text-app-text">
                    {getNestedValue(dictionary, feature.titleKey)}
                  </CardTitle>
                  <CardDescription className="text-app-text-muted">
                    {getNestedValue(dictionary, feature.descriptionKey)}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
