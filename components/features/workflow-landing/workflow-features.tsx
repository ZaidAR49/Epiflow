import { useTranslations } from "next-intl";
import {
  Layers,
  ShieldCheck,
  Mail,
  AlertTriangle,
  Send,
  Languages,
} from "lucide-react";

export function WorkflowFeatures() {
  const t = useTranslations("workflowLanding");

  const features = [
    {
      icon: Layers,
      color: "text-[var(--accent)]",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/20",
      title: t("feat1Title"),
      desc: t("feat1Desc"),
    },
    {
      icon: ShieldCheck,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      title: t("feat2Title"),
      desc: t("feat2Desc"),
    },
    {
      icon: Mail,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      title: t("feat3Title"),
      desc: t("feat3Desc"),
    },
    {
      icon: AlertTriangle,
      color: "text-[var(--warn)]",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      title: t("feat4Title"),
      desc: t("feat4Desc"),
    },
    {
      icon: Send,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      title: t("feat5Title"),
      desc: t("feat5Desc"),
    },
    {
      icon: Languages,
      color: "text-rose-400",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/20",
      title: t("feat6Title"),
      desc: t("feat6Desc"),
    },
  ];

  return (
    <section id="features" className="py-20 border-b border-[var(--border)] bg-[var(--surface)]/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl">
            {t("featuresTitle")}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
            {t("featuresSubtitle")}
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, index) => {
            const IconComponent = feat.icon;
            return (
              <div
                key={index}
                className="group relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm hover:border-[var(--accent)]/40 hover:bg-[var(--surface-2)]/60 transition-all duration-200 text-start flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${feat.bgColor} ${feat.color} border ${feat.borderColor} mb-5 group-hover:scale-105 transition-transform duration-200`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-[var(--text)] tracking-tight">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
