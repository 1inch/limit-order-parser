import { createContext, HTMLAttributes, useContext, useState } from "react";

export enum ConnectionStatus {
  Disconnected,
  InProgress,
  Connected,
}
export interface ConnectionContextType {
  status: ConnectionStatus;
  setStatus: (status: ConnectionStatus) => void;
  addresses: Set<string>;
  setAddresses: (addresses: Set<string>) => void;
  selectedAddress: string | null;
  setSelectedAddress: (address: string) => void;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useProvider must be used within a Provider');
  }
  return context;
}

export default function Connection({ children }: HTMLAttributes<HTMLElement>) {
  const [status, setStatus] = useState(ConnectionStatus.Disconnected);
  const [addresses, setAddresses] = useState(new Set<string>());
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  return (
    <ConnectionContext.Provider value={{ status, setStatus, addresses, setAddresses, selectedAddress, setSelectedAddress }}>
      { children }
    </ConnectionContext.Provider>
  );
}
