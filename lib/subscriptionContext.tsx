import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { addCustomerInfoUpdateListener, checkPremium } from './purchases';

type SubscriptionContextType = {
  isPremium: boolean;
  isLoading: boolean;
  refresh: () => Promise<boolean>;
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPremium: false,
  isLoading: true,
  refresh: async () => false,
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async (): Promise<boolean> => {
    try {
      const premium = await checkPremium();
      setIsPremium(premium);
      return premium;
    } catch {
      setIsPremium(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // RevenueCatが購入を検証した瞬間にisPremiumを更新する
  useEffect(() => {
    return addCustomerInfoUpdateListener((premium) => setIsPremium(premium));
  }, []);

  return (
    <SubscriptionContext.Provider value={{ isPremium, isLoading, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
