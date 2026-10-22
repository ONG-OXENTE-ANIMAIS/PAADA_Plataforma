import Hero from "@/components/home/Hero";
import Ticker from "@/components/home/Ticker";
import VaquinhaSection from "@/components/home/VaquinhaSection";
import NumStrip from "@/components/home/NumStrip";
import ComoFunciona from "@/components/home/ComoFunciona";
import Quote from "@/components/home/Quote";
import Parceiros from "@/components/home/Parceiros";

export default function HomePage() {
  return (
    <section className="screen active" data-screen="home">
      <Hero />
      {/* <Ticker /> */}
      <VaquinhaSection />
      <div className="fita" aria-hidden="true"></div>
      <NumStrip />
      <ComoFunciona />
      <Quote />
      <Parceiros />
    </section>
  );
}
