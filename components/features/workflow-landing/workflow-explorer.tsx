"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { PRESET_SCENARIOS, DEFAULT_PRESET, getLocalizedPreset } from "./presets-data";
import type { PresetData } from "./types";
import { WorkflowStepperBar } from "./workflow-stepper-bar";
import { Stage1Panel } from "./stages/stage-1-panel";
import { Stage2Panel } from "./stages/stage-2-panel";
import { Stage3Panel } from "./stages/stage-3-panel";
import { Stage4Panel } from "./stages/stage-4-panel";
import { Stage5Panel } from "./stages/stage-5-panel";
import { StackedXrayView } from "./stages/stacked-xray-view";

interface WorkflowExplorerProps {
  onShowToast: (message: string) => void;
  onOpenGmailModal: () => void;
  onOpenCuratorModal: () => void;
}

export function WorkflowExplorer({
  onShowToast,
  onOpenGmailModal,
  onOpenCuratorModal,
}: WorkflowExplorerProps) {
  const locale = useLocale();
  const t = useTranslations("workflowLanding");

  const [currentPresetKey, setCurrentPresetKey] = useState<string>("acme");
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [autoStep, setAutoStep] = useState<boolean>(true);
  const [stackedMode, setStackedMode] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [commLang, setCommLang] = useState<"en" | "ar">((locale as "en" | "ar") || "en");
  const [inputUrl, setInputUrl] = useState<string>(DEFAULT_PRESET.url);

  const rawPreset = PRESET_SCENARIOS[currentPresetKey] ?? DEFAULT_PRESET;
  const activePreset: PresetData = getLocalizedPreset(rawPreset, locale);

  const stageDescriptions: Record<number, string> = {
    1: t("explorerStage1Desc"),
    2: t("explorerStage2Desc"),
    3: t("explorerStage3Desc"),
    4: t("explorerStage4Desc"),
    5: t("explorerStage5Desc"),
  };

  useEffect(() => {
    if (!autoStep || stackedMode) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2.2;
        if (next >= 100) {
          setCurrentStage((curr) => (curr < 5 ? curr + 1 : 1));
          return 0;
        }
        return next;
      });
    }, 115);
    return () => clearInterval(interval);
  }, [autoStep, stackedMode]);

  const selectStage = (stage: number) => {
    setAutoStep(false);
    setStackedMode(false);
    setCurrentStage(stage);
    setProgress(100);
  };

  const handleSelectPreset = (key: string, name: string) => {
    setCurrentPresetKey(key);
    const data = PRESET_SCENARIOS[key];
    if (data) setInputUrl(data.url);
    setCurrentStage(1);
    setProgress(0);
    setAutoStep(true);
    onShowToast(t("toastSampleLoaded", { name }));
  };

  const handleRunInspection = () => {
    setCurrentStage(2);
    setProgress(0);
    setAutoStep(true);
    onShowToast(t("toastRunning"));
  };

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText(activePreset.email);
    onShowToast(t("toastCopiedEmail", { email: activePreset.email }));
  };

  const handleCopyCommunityPost = () => {
    const langData = commLang === "ar" ? activePreset.commAr : activePreset.commEn;
    const formatted = `${langData.title}\n${langData.meta}\n\n${langData.summary}\n\n${langData.apply}`;
    navigator.clipboard?.writeText(formatted);
    onShowToast(t("toastCopiedPost"));
  };

  const stages = [
    { num: "01", category: t("explorerStage1Type"), label: t("explorerStage1Label") },
    { num: "02", category: t("explorerStage2Type"), label: t("explorerStage2Label") },
    { num: "03", category: t("explorerStage3Type"), label: t("explorerStage3Label") },
    { num: "04", category: t("explorerStage4Type"), label: t("explorerStage4Label") },
    { num: "05", category: t("explorerStage5Type"), label: t("explorerStage5Label") },
  ];

  return (
    <div
      id="workbenchAnchor"
      className="max-w-5xl mx-auto surface-card rounded-xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
    >
      {/* Top URL Bar & Preset Selector */}
      <div className="p-6 sm:p-8 border-b hairline-border bg-[var(--bg)]/50 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-[var(--text-muted)] me-1">
              {t("explorerSampleLinks")}
            </span>
            <button
              type="button"
              onClick={() => handleSelectPreset("acme", t("explorerPresetAcme"))}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                currentPresetKey === "acme"
                  ? "bg-[var(--accent)]/15 text-[var(--text)] border-[var(--accent)]/50"
                  : "surface-card text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {t("explorerPresetAcme")}
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("nebula", t("explorerPresetNebula"))}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                currentPresetKey === "nebula"
                  ? "bg-[var(--accent)]/15 text-[var(--text)] border-[var(--accent)]/50"
                  : "surface-card text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {t("explorerPresetNebula")}
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("stealth", t("explorerPresetStealth"))}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                currentPresetKey === "stealth"
                  ? "bg-[var(--accent)]/15 text-[var(--text)] border-[var(--accent)]/50"
                  : "surface-card text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {t("explorerPresetStealth")}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoStep(!autoStep)}
              className="px-3 py-1.5 rounded-lg surface-card hover:bg-[var(--surface-2)] font-mono text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              {autoStep ? t("explorerPauseAutoStep") : t("explorerResumeAutoStep")}
            </button>
            <button
              type="button"
              onClick={() => setStackedMode(!stackedMode)}
              className={`px-3.5 py-1.5 rounded-lg font-mono text-xs border transition-all ${
                stackedMode
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "surface-card hover:bg-[var(--surface-2)] text-[var(--accent)] border-[var(--accent)]/30"
              }`}
            >
              {stackedMode ? t("explorerReturnExplorer") : t("explorerViewStacked")}
            </button>
          </div>
        </div>

        {/* URL Input Box + Trigger */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center px-4 py-3 rounded-lg bg-[var(--bg)] border hairline-border focus-within:border-[var(--accent)] transition-colors">
            <span className="font-mono text-xs text-[var(--accent)] me-3 select-none shrink-0">
              {t("explorerUrlLabel")}
            </span>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              aria-label="LinkedIn Post URL"
              className="w-full bg-transparent font-mono text-xs sm:text-sm text-[var(--text)] focus:outline-none truncate"
              dir="ltr"
            />
          </div>
          <button
            type="button"
            onClick={handleRunInspection}
            className="px-6 py-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium text-sm shrink-0 transition-all flex items-center justify-center gap-2"
          >
            <span>{t("explorerInspectBtn")}</span>
            <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
          </button>
        </div>
      </div>

      {/* 5-Stage Horizontal Pipeline Stepper Bar */}
      <WorkflowStepperBar
        stages={stages}
        currentStage={currentStage}
        stackedMode={stackedMode}
        progress={progress}
        onSelectStage={selectStage}
      />

      {/* STAGE VIEWPORT AREA */}
      <div className="p-8 sm:p-10 lg:p-12 min-h-[430px] flex flex-col justify-between bg-[var(--surface)]">
        {stackedMode ? (
          <StackedXrayView
            data={activePreset}
            onOpenGmailModal={onOpenGmailModal}
            onOpenCuratorModal={onOpenCuratorModal}
          />
        ) : (
          <>
            {currentStage === 1 && <Stage1Panel data={activePreset} />}
            {currentStage === 2 && <Stage2Panel data={activePreset} />}
            {currentStage === 3 && <Stage3Panel data={activePreset} />}
            {currentStage === 4 && (
              <Stage4Panel
                data={activePreset}
                onCopyEmail={handleCopyEmail}
                onOpenGmailModal={onOpenGmailModal}
              />
            )}
            {currentStage === 5 && (
              <Stage5Panel
                data={activePreset}
                commLang={commLang}
                onSetCommLang={setCommLang}
                onCopyCommunityPost={handleCopyCommunityPost}
                onOpenCuratorModal={onOpenCuratorModal}
              />
            )}
          </>
        )}

        {/* Clean Bottom Status Bar */}
        <div className="pt-6 mt-8 border-t hairline-border flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-[var(--text-muted)]">
          <span>
            {stackedMode ? t("explorerStackedDesc") : stageDescriptions[currentStage]}
          </span>
          <span>{t("explorerGuaranteeBar")}</span>
        </div>
      </div>
    </div>
  );
}
