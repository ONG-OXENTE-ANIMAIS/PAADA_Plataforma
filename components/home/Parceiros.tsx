import Link from "next/link";
import ParceirosGrid from "@/components/parceiros/ParceirosGrid";

/** Seção "Parceiros" da home — quem caminha com a Oxente. */
export default function Parceiros() {
  return (
    <section
      className="sec"
      id="parceiros"
      style={{
        paddingLeft: 0,
        paddingRight: 0,
        maxWidth: "1240px",
        margin: "0 auto",
      }}
    >
      <div className="sec-head">
        <h2>
          Quem caminha <span className="conta">com a gente</span>
        </h2>
        <Link href="/parcerias" className="link-mais">
          Quero ser parceiro <i className="ph ph-arrow-right"></i>
        </Link>
      </div>
      <ParceirosGrid />
    </section>
  );
}
