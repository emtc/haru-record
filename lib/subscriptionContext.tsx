import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { checkPremium } from './purchases';

type SubscriptionContextType = {
  isPremium: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPremium: false,
  isLoading: true,
  refresh: async () => {},
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const premium = await checkPremium();
      setIsPremium(premium);
    } catch {
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <SubscriptionContext.Provider value={{ isPremium, isLoading, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
