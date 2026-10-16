"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { SEED_CAMPAIGNS, type Campaign } from "@/lib/campaigns";

type CampaignsCtx = {
  campaigns: Campaign[];
  donate: (slug: string, valor: number) => void;
  addCampaign: (c: Campaign) => void;
};

const Ctx = createContext<CampaignsCtx>({
  campaigns: SEED_CAMPAIGNS,
  donate: () => {},
  addCampaign: () => {},
});

export const useCampaigns = () => useContext(Ctx);

export default function CampaignsProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(SEED_CAMPAIGNS);

  const donate = (slug: string, valor: number) =>
    setCampaigns((cs) =>
      cs.map((c) =>
        c.slug === slug
          ? { ...c, raised: c.raised + valor, backers: c.backers + 1 }
          : c,
      ),
    );

  const addCampaign = (c: Campaign) => setCampaigns((cs) => [c, ...cs]);

  const value = useMemo(
    () => ({ campaigns, donate, addCampaign }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campaigns],
  );

  return <Ctx value={value}>{children}</Ctx>;
}
