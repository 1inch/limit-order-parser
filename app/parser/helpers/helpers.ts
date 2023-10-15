import Web3 from "web3";
import {
    EIP712TypedData,
    LimitOrderBuilder, LimitOrderProtocolFacade, ParsedMakerTraits,
    PROTOCOL_NAME,
    PROTOCOL_VERSION,
    ProviderConnector, Web3ProviderConnector
} from "@1inch/limit-order-protocol-utils";

export type FormattedMakerTraits = Omit<ParsedMakerTraits, 'nonce' | 'series'> & { nonce: number, series: number };

const addressMap = new Map([
    // [1, ethereumMainContracts],
    // [56, binanceMainContracts],
    [137, '0xe2942bf5973ce8746a6dae222e11b5a56bc84202']
])

let web3: Web3 | null = null;
let facade: LimitOrderProtocolFacade | null = null;
export async function  connectWeb3() {
    if (web3) {
        return;
    }

    if (typeof (window as any).ethereum !== 'undefined') {
        web3 = new Web3((window as any).ethereum);
        try {
            await (window as any).ethereum.enable();
        } catch (error) {
            console.error('User denied account access', error);
        }
    } else {
        console.error('Please install MetaMask');
    }
}

export async function getContractData() {
    await connectWeb3();
    const networkId = await web3?.eth.net.getId()!;
    const contractAddress = addressMap.get(networkId ?? 1)!;

    return {
        networkId,
        contractAddress
    }
}

export function createProviderConnector(): ProviderConnector {
    const ethereum = (window as any).ethereum;
    return {
        signTypedData(
            walletAddress: string,
            typedData: EIP712TypedData,
            dataHash: string,
        ) {
            return ethereum.request({
                "method": "eth_signTypedData_v4",
                "params": [
                    walletAddress,
                    typedData
                ]
            })
        }
    } as ProviderConnector;
}

export function getLimitOrderBuilder() {
    const builder = new LimitOrderBuilder(
        createProviderConnector(),
        {
            domainName: PROTOCOL_NAME,
            version: PROTOCOL_VERSION,
        }
    );
    return builder;
}

export function getProvideConnector() {
    return new Web3ProviderConnector(web3 as any)
}

export async function getLimitOrderFacade() {
    const { networkId, contractAddress } = await getContractData();
    const connector = getProvideConnector();
    return  new LimitOrderProtocolFacade(
        contractAddress!, networkId, connector
    );
}

