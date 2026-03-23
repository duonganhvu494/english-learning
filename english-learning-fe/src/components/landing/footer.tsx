import { useAppSettings } from "@/providers/app-settings-provider";
import { GraduationCap } from "lucide-react";

export function Footer() {
  const { dictionary } = useAppSettings();

  return (
    <footer className="bg-app-text text-(--color-text-inverse) py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-linear-to-br from-(--color-primary) to-(--color-accent) rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-(--color-text-inverse)" />
              </div>
              <span className="font-semibold text-(--color-text-inverse)">
                {dictionary.appName}
              </span>
            </div>
            <p className="text-sm text-app-text-soft">
              {dictionary.landing.footer.brand.description}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-(--color-text-inverse) mb-4">
              {dictionary.landing.footer.sections.product.title}
            </h3>
            <ul className="space-y-2 text-sm text-app-text-soft">
              <li>
                <a
                  href="#features"
                  className="hover:text-(--color-text-inverse)"
                >
                  {dictionary.landing.footer.sections.product.features}
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="hover:text-(--color-text-inverse)"
                >
                  {dictionary.landing.footer.sections.product.pricing}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-(--color-text-inverse)">
                  {dictionary.landing.footer.sections.product.updates}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-(--color-text-inverse)">
                  {dictionary.landing.footer.sections.product.roadmap}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-(--color-text-inverse) mb-4">
              {dictionary.landing.footer.sections.resources.title}
            </h3>
            <ul className="space-y-2 text-sm text-app-text-soft">
              <li>
                <a href="#" className="hover:text-(--color-text-inverse)">
                  {dictionary.landing.footer.sections.resources.documentation}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-(--color-text-inverse)">
                  {dictionary.landing.footer.sections.resources.tutorials}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-(--color-text-inverse)">
                  {dictionary.landing.footer.sections.resources.blog}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-(--color-text-inverse)">
                  {dictionary.landing.footer.sections.resources.support}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-(--color-text-inverse) mb-4">
              {dictionary.landing.footer.sections.company.title}
            </h3>
            <ul className="space-y-2 text-sm text-app-text-soft">
              <li>
                <a href="#" className="hover:text-(--color-text-inverse)">
                  {dictionary.landing.footer.sections.company.about}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-(--color-text-inverse)">
                  {dictionary.landing.footer.sections.company.contact}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-(--color-text-inverse)">
                  {dictionary.landing.footer.sections.company.privacy}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-(--color-text-inverse)">
                  {dictionary.landing.footer.sections.company.terms}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-app-border pt-8 text-center text-sm text-app-text-soft">
          <p>{dictionary.landing.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
