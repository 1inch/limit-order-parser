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
    [1, '0xc6f9b19e2e91a8cd3b7ff62aa68e4de8f7cdddbc'],
    [137, '0xdc49a6e76f017175ba46e5038a4df6606d961ff3']
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

export async function getWeb3Data() {
    await connectWeb3();
    const networkId = await web3?.eth.net.getId()!;
    const contractAddress = addressMap.get(networkId ?? 1)!;
    const currentAddress = await web3?.eth.getAccounts();

    return {
        networkId: BigInt(networkId),
        contractAddress,
        maker: currentAddress?.[0],
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
    if (facade) {
        return facade;
    }

    const { networkId, contractAddress } = await getWeb3Data();
    const connector = getProvideConnector();
    return  new LimitOrderProtocolFacade(
        contractAddress!, Number(networkId), connector
    );
}

