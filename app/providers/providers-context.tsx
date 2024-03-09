import { createContext, FC, HTMLAttributes, useContext, useState } from "react";
import { EIP6963AnnounceProviderEvent, EIP6963ProviderDetail } from "@/app/types/eip6963";

type ProviderInstance = EIP6963ProviderDetail;

export type ProvidersMap = Map<string, ProviderInstance>;

export interface ProviderContextType {
  providers: ProvidersMap;
  activeProvider: ProviderInstance | null;
  setActiveProvider: (Provider: ProviderInstance | null) => void;
  addProvider: (provider: ProviderInstance) => void;
}

const ProviderContext = createContext<ProviderContextType | undefined>(undefined);

export const useProvider = () => {
  const context = useContext(ProviderContext);
  if (context === undefined) {
    throw new Error('useProvider must be used within a Provider');
  }
  return context;
}

export default function Provider({ children }: HTMLAttributes<HTMLElement>) {
  const [providers, setProviders] = useState<ProvidersMap>(new Map());
  const [activeProvider, setActiveProvider] = useState<ProviderInstance | null>(null);

  const addProvider = (provider: EIP6963AnnounceProviderEvent) => {
    setProviders((providers) => {
      const {detail} = provider;
      const newProviders = new Map(providers);
      newProviders.set(detail.info.name, detail);
      return newProviders;
    });
  };

 return (
     <ProviderContext.Provider value={{ providers, activeProvider, setActiveProvider, addProvider }}>
       { children }
    </ProviderContext.Provider>
 );
}

