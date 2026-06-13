"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Business } from "@/lib/types";

const STORAGE_KEY = "skypulse_business_id";

interface BusinessContextValue {
  businesses: Business[];
  business: Business;
  businessId: string;
  setBusinessId: (id: string) => void;
  refreshBusinesses: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessId, setBusinessIdState] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  const fetchBusinesses = useCallback(async () => {
    try {
      const res = await fetch("/api/businesses");
      if (res.ok) {
        const data = await res.json();
        const list: Business[] = data.businesses ?? [];
        setBusinesses(list);
        return list;
      }
    } catch {
      // fallback handled below
    }
    return [] as Business[];
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const list = await fetchBusinesses();
      if (cancelled) return;

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && list.some((b) => b.id === stored)) {
        setBusinessIdState(stored);
      } else if (list.length > 0) {
        setBusinessIdState(list[0].id);
      }
      setHydrated(true);
    }
    init();
    return () => { cancelled = true; };
  }, [fetchBusinesses]);

  const setBusinessId = useCallback((id: string) => {
    setBusinessIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const refreshBusinesses = useCallback(async () => {
    const list = await fetchBusinesses();
    if (list.length > 0 && !list.some((b) => b.id === businessId)) {
      setBusinessIdState(list[0].id);
    }
  }, [fetchBusinesses, businessId]);

  const business = businesses.find((b) => b.id === businessId) ?? businesses[0];

  if (!hydrated || !business) return null;

  return (
    <BusinessContext.Provider value={{ businesses, business, businessId, setBusinessId, refreshBusinesses }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness(): BusinessContextValue {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used within BusinessProvider");
  return ctx;
}
