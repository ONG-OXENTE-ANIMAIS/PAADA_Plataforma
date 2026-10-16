import Link from "next/link";

export default function AdminBar() {
  return (
    <header className="adminbar">
      <div className="wrap">
        <span className="logo">
          <svg className="sol">
            <use href="#sol" />
          </svg>
          oxente
        </span>
        <span className="admin-tag">Painel da ONG · Construtor de vaquinhas</span>
        <div className="direita">
          <span className="equipe">
            <span className="avatar-ini">EO</span>Equipe Oxente
          </span>
          <Link href="/" className="btn-sair">
            <i className="ph ph-sign-out"></i> Sair para o site
          </Link>
        </div>
      </div>
    </header>
  );
}
