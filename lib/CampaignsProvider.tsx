"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api-client";
import { campaignFromApi, type Campaign, type CampanhaApi } from "@/lib/campaigns";

type Pagina<T> = { data: T[]; pagination: { total: number } };

type CampaignsCtx = {
  campaigns: Campaign[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

const Ctx = createContext<CampaignsCtx>({
  campaigns: [],
  loading: true,
  error: null,
  reload: () => {},
});

/** Fonte de verdade das campanhas públicas: GET /api/campanhas (apenas
 *  ATIVAS e visíveis, conforme regras do backend). */
export const useCampaigns = () => useContext(Ctx);

export default function CampaignsProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let ativo = true;
    apiFetch<Pagina<CampanhaApi>>("/api/campanhas?limit=100")
      .then((pagina) => {
        if (!ativo) return;
        setCampaigns(pagina.data.map(campaignFromApi));
        setError(null);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (!ativo) return;
        setCampaigns([]);
        setError(e.message);
        setLoading(false);
      });
    return () => {
      ativo = false;
    };
  }, [nonce]);

  const value = useMemo(() => ({ campaigns, loading, error, reload }), [campaigns, loading, error, reload]);

  return <Ctx value={value}>{children}</Ctx>;
}
