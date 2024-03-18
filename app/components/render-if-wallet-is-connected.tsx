import Provider, { useProvider } from "@/app/providers/providers-context";
import { ReactNode } from "react";

export default function RenderIfWalletIsConnected(props: {
  ifConnected: ReactNode,
  ifNotConnected: ReactNode,
}) {

  return (
    <Provider>
      <Main {...props}/>
    </Provider>
  );
}

function Main({
  ifConnected,
  ifNotConnected
}: {
  ifConnected: ReactNode,
  ifNotConnected: ReactNode,
}) {
  const { activeProvider } = useProvider();
  return (<>
    {
      activeProvider
        ? ifConnected
        : ifNotConnected
    }
  </>)
}
