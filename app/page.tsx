'use client'
import React, { useEffect } from "react";
import Parser from "@/app/parser/parser";
import { EIP6963AnnounceProviderEvent } from "@/app/types/eip6963";
import Provider, { useProvider } from "@/app/providers/providers-context";

export default function Home() {
  return (
      <Provider>
          <Main></Main>
      </Provider>
  )
}

function Main() {
  const { addProvider } = useProvider();

  useEffect(() => {
    const eip6963EventName = 'eip6963:announceProvider';
    const handleEvent = (event: any) => {
      const eventAsEIP6963AnnounceProviderEvent = event as EIP6963AnnounceProviderEvent;
      addProvider(event);
    };

    window.addEventListener(
      eip6963EventName,
      handleEvent,
    );

    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => window.removeEventListener(eip6963EventName, handleEvent);
  }, []);

  return (
    <>
      <Parser></Parser>
    </>
  )
}
