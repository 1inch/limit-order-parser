import Provider, { useProvider } from "@/app/providers/providers-context";
import { ReactNode } from "react";

export default function RenderIfWalletIsConnected({
  ifConnected,
  ifNotConnected
}: {
  ifConnected: ReactNode,
  ifNotConnected: ReactNode,
}) {
  const { activeProvider } = useProvider();

  return (
    <Provider>
      {
        activeProvider
          ? ifConnected
          : ifNotConnected
      }
    </Provider>
  );
}
