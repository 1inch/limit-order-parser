import {
  EIP712TypedData,
  LimitOrderBuilder,
  LimitOrderProtocolFacade, LimitOrderProtocolV3Facade, LimitOrderV3Builder,
  ParsedMakerTraits,
  PROTOCOL_NAME,
  PROTOCOL_VERSION,
  ProviderConnector,
  Web3ProviderConnector
} from "@1inch/limit-order-protocol-utils";
import { contractAddresses, EthChainId } from "@/app/helpers/contracts";
import { Web3Provider } from "@ethersproject/providers";
import { throws } from "assert";
import { Contract } from "ethers";
import { EthersProviderConnector } from "@/app/helpers/ethers-provider-connector";

export type FormattedMakerTraits = Omit<ParsedMakerTraits, 'nonce' | 'series'> & { nonce: number, series: number };

let web3: Web3Provider | null = null;
let facade: LimitOrderProtocolFacade | null = null;
let facadeV3: LimitOrderProtocolV3Facade | null = null;
export async function  connectWeb3() {
    if (web3) {
        return;
    }

    if (typeof (window as any).ethereum !== 'undefined') {
        web3 = new Web3Provider((window as any).ethereum);
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
  const network = await web3?.getNetwork();
  const networkId = network?.chainId;
  if (networkId === undefined) {
    throw new Error('Network id is not defined');
  }
  const contractAddress = contractAddresses.get(networkId as EthChainId)!;
  const contractAddressV3 = '0x1111111254EEB25477B68fb85Ed929f73A960582';
  const currentAddress = await web3?.listAccounts()

  return {
    networkId,
    contractAddress,
    contractAddressV3,
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
    return  new LimitOrderBuilder(
        createProviderConnector(),
        {
            domainName: PROTOCOL_NAME,
            version: PROTOCOL_VERSION,
        }
    );
}

export function getLimitOrderBuilderV3() {
  return new LimitOrderV3Builder(
    createProviderConnector(),
    {
      version: '1inch Aggregation Router',
      domainName: '5',
    }
  )
}

export function getProvideConnector() {
  const ethereum = web3;

  if (!ethereum) {
    throw new Error('Please connect a wallet first');
  }

  return new EthersProviderConnector(ethereum);
}

export async function getLimitOrderFacade() {
    if (facade) {
        return facade;
    }

    const { networkId, contractAddress } = await getWeb3Data();
    const connector = getProvideConnector();
    return  new LimitOrderProtocolFacade(
        contractAddress!, networkId, connector
    );
}

export async function getLimitOrderFacadeV3() {
    if (facadeV3) {
        return facadeV3;
    }

    const { networkId, contractAddressV3 } = await getWeb3Data();
    const connector = getProvideConnector();
    return  new LimitOrderProtocolV3Facade(
      contractAddressV3, networkId, connector
    );
}

