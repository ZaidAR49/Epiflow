import { useTranslations } from "next-intl";
import { Link2, Cpu, MailCheck } from "lucide-react";

export function WorkflowHowItWorks() {
  const t = useTranslations("workflowLanding");

  const steps = [
    {
      num: "01",
      icon: Link2,
      color: "text-[var(--accent)]",
      borderColor: "border-[var(--accent)]/30",
      bgColor: "bg-indigo-500/10",
      title: t("step1Title"),
      desc: t("step1Desc"),
    },
    {
      num: "02",
      icon: Cpu,
      color: "text-emerald-400",
      borderColor: "border-emerald-500/30",
      bgColor: "bg-emerald-500/10",
      title: t("step2Title"),
      desc: t("step2Desc"),
    },
    {
      num: "03",
      icon: MailCheck,
      color: "text-purple-400",
      borderColor: "border-purple-500/30",
      bgColor: "bg-purple-500/10",
      title: t("step3Title"),
      desc: t("step3Desc"),
    },
  ];

  return (
    <section id="how-it-works" className="py-20 border-b border-[var(--border)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl">
            {t("howItWorksTitle")}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
            {t("howItWorksSubtitle")}
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm hover:border-[var(--accent)]/30 transition-all text-start flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span
                      className={`font-mono text-xs font-extrabold tracking-wider px-2.5 py-1 rounded-md ${step.bgColor} ${step.color} border ${step.borderColor}`}
                    >
                      STEP {step.num}
                    </span>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${step.bgColor} ${step.color} border ${step.borderColor}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-[var(--text)] tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                    {step.desc}
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
