import { useAppSettings } from "@/providers/app-settings-provider";
import { Card, CardHeader, CardDescription, CardContent } from "../ui/card";
import { testimonials } from "@/mock-data/landing";
import { getNestedValue } from "@/utils/object";
import { Star } from "lucide-react";

export function TestimonialsSection() {
  const { dictionary } = useAppSettings();

  return (
    <section className="py-20 bg-app-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-app-text">
            {dictionary.landing.testimonials.title}
          </h2>
          <p className="text-xl text-app-text-muted">
            {dictionary.landing.testimonials.description}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.nameKey}>
              <CardHeader>
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-(--color-accent) text-(--color-accent)"
                    />
                  ))}
                </div>
                <CardDescription className="text-base italic text-app-text">
                  &ldquo;{getNestedValue(dictionary, testimonial.contentKey)}
                  &rdquo;
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="font-medium text-app-text">
                  {getNestedValue(dictionary, testimonial.nameKey)}
                </div>
                <div className="text-sm text-app-text-muted">
                  {getNestedValue(dictionary, testimonial.roleKey)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
