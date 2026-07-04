import { Suspense } from "react";
import Topbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import LiveTicker from "@/components/home/LiveTicker";
import ArchitectureSection from "@/components/home/ArchitectureSection";
import WorkforceSection from "@/components/home/AgentsSection";
import OperationsSection from "@/components/home/OperationsSection";
import ResolutionSection from "@/components/home/ResolutionSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import HashScroller from "@/components/home/HashScroller";

export default function Page() {
    return (
        <main className="paper min-h-screen text-[var(--ink)]">
            <Suspense fallback={null}>
                <Topbar />
            </Suspense>

            {/* The Topbar is fixed; the main content needs top padding to clear it */}
            <div className="pt-16">
                <HashScroller />
                <HeroSection />
                <LiveTicker />
                <ArchitectureSection />
                <WorkforceSection />
                <HowItWorksSection />
                <OperationsSection />
                <ResolutionSection />
            </div>

            <Footer />
        </main>
    );
}
