import { Suspense, lazy, useState } from "react";
import bg from "./assets/backgrounds/cosmos.svg";
import { FeedbackDialog } from "./components/learning/FeedbackDialog";
import { Sidebar } from "./components/layout/Sidebar";
import { MobileNav, TopBar } from "./components/layout/TopBar";
import type { PageId } from "./components/layout/nav";
import { AppProvider } from "./hooks/useApp";
import { Dashboard } from "./pages/Dashboard";
import { GrowthJourney } from "./pages/GrowthJourney";
import { Journal } from "./pages/Journal";
import { Mistakes } from "./pages/Mistakes";
import { Notes } from "./pages/Notes";
import { PlantGallery } from "./pages/PlantGallery";
import { Roadmap } from "./pages/Roadmap";
import { Settings } from "./pages/Settings";
import { StudyPlan } from "./pages/StudyPlan";

const StudyRecords = lazy(() => import("./pages/StudyRecords").then((m) => ({ default: m.StudyRecords })));

export default function App() {
  const [page, setPage] = useState<PageId>("dashboard");
  const [notesDate, setNotesDate] = useState<string | undefined>(undefined);
  const go = (p: PageId, date?: string) => {
    if (p === "notes" && date) setNotesDate(date);
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AppProvider>
      <div className="relative min-h-screen">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${bg})` }} />
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(10,10,32,0.15),rgba(5,6,20,0.72)_70%)]" />

        <div className="flex min-h-screen">
          <Sidebar page={page} onNavigate={go} />
          <main className="min-w-0 flex-1 px-3 pb-24 pt-4 sm:px-4 lg:pr-6 lg:pb-10 lg:pt-6">
            <div className="mx-auto w-full max-w-[1180px]">
              <TopBar page={page} onNavigate={go} />
              {page === "dashboard" && <Dashboard onNavigate={go} />}
              {page === "roadmap" && <Roadmap />}
              {page === "plan" && <StudyPlan onOpenNotes={(d) => go("notes", d)} />}
              {page === "records" && (
                <Suspense fallback={<div className="glass p-6 text-sm text-[var(--color-muted)]">正在载入图表…</div>}>
                  <StudyRecords />
                </Suspense>
              )}
              {page === "notes" && <Notes initialDate={notesDate} />}
              {page === "mistakes" && <Mistakes />}
              {page === "gallery" && <PlantGallery />}
              {page === "journey" && <GrowthJourney onOpenGallery={() => go("gallery")} />}
              {page === "journal" && <Journal />}
              {page === "settings" && <Settings />}
            </div>
          </main>
        </div>

        <MobileNav page={page} onNavigate={go} />
        <FeedbackDialog />
      </div>
    </AppProvider>
  );
}
