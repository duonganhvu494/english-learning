import {
  GraduationCap,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  CheckCircle,
} from "lucide-react";

export const features = [
  {
    icon: GraduationCap,
    titleKey: "landing.features.items.classManagement.title",
    descriptionKey: "landing.features.items.classManagement.description",
  },
  {
    icon: Users,
    titleKey: "landing.features.items.studentTracking.title",
    descriptionKey: "landing.features.items.studentTracking.description",
  },
  {
    icon: FileText,
    titleKey: "landing.features.items.assignments.title",
    descriptionKey: "landing.features.items.assignments.description",
  },
  {
    icon: Calendar,
    titleKey: "landing.features.items.calendar.title",
    descriptionKey: "landing.features.items.calendar.description",
  },
  {
    icon: TrendingUp,
    titleKey: "landing.features.items.analytics.title",
    descriptionKey: "landing.features.items.analytics.description",
  },
  {
    icon: CheckCircle,
    titleKey: "landing.features.items.grading.title",
    descriptionKey: "landing.features.items.grading.description",
  },
];

export const testimonials = [
  {
    nameKey: "landing.testimonials.items.michael.name",
    roleKey: "landing.testimonials.items.michael.role",
    contentKey: "landing.testimonials.items.michael.content",
    rating: 5,
  },
  {
    nameKey: "landing.testimonials.items.emily.name",
    roleKey: "landing.testimonials.items.emily.role",
    contentKey: "landing.testimonials.items.emily.content",
    rating: 5,
  },
  {
    nameKey: "landing.testimonials.items.david.name",
    roleKey: "landing.testimonials.items.david.role",
    contentKey: "landing.testimonials.items.david.content",
    rating: 5,
  },
];

export const pricingPlans = [
  {
    nameKey: "landing.pricing.plans.free.name",
    priceKey: "landing.pricing.plans.free.price",
    periodKey: "landing.pricing.plans.free.period",
    descriptionKey: "landing.pricing.plans.free.description",
    featuresKeys: "landing.pricing.plans.free.features",
    ctaKey: "landing.pricing.plans.free.cta",
    popular: false,
  },
  {
    nameKey: "landing.pricing.plans.pro.name",
    priceKey: "landing.pricing.plans.pro.price",
    periodKey: "landing.pricing.plans.pro.period",
    descriptionKey: "landing.pricing.plans.pro.description",
    featuresKeys: "landing.pricing.plans.pro.features",
    ctaKey: "landing.pricing.plans.pro.cta",
    popular: true,
  },
  {
    nameKey: "landing.pricing.plans.enterprise.name",
    priceKey: "landing.pricing.plans.enterprise.price",
    periodKey: "landing.pricing.plans.enterprise.period",
    descriptionKey: "landing.pricing.plans.enterprise.description",
    featuresKeys: "landing.pricing.plans.enterprise.features",
    ctaKey: "landing.pricing.plans.enterprise.cta",
    popular: false,
  },
];
