'use client'
import Link from 'next/link'
import Web3 from "web3";
import React from "react";
import {omit} from "next/dist/shared/lib/router/utils/omit";
import {FormattedMakerTraits, getLimitOrderFacade} from "@/app/parser/helpers/helpers";
import Parser from "@/app/parser/parser";

export default function Home() {
  return (
    <main className="flex flex-col">
        <Parser></Parser>
    </main>
  )
}
