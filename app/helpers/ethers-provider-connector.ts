import { AbiDecodeResult, AbiItem, EIP712TypedData, ProviderConnector } from "@1inch/limit-order-protocol-utils";
import { AbiCoder, Interface, } from "ethers";
import { Web3Provider } from "@ethersproject/providers";
import { AbiOutput } from "web3-utils";
import { JsonRpcSigner } from "@ethersproject/providers/src.ts/json-rpc-provider";

export class EthersProviderConnector implements ProviderConnector {
  #orderContract: Interface | null = null;

  readonly #abiCoder = new AbiCoder();

  readonly #web3Provider: Web3Provider;

  readonly #signer: JsonRpcSigner;

  constructor(provider: Web3Provider) {
    this.#web3Provider = provider;
    this.#signer = this.#web3Provider.getSigner();
  }

  contractEncodeABI(
    abi: AbiItem[],
    address: string | null,
    methodName: string,
    methodParams: unknown[]
  ): string {
    if (this.#orderContract === null) {
      this.#orderContract = new Interface(abi);
    }

    return this.#orderContract.encodeFunctionData(methodName, methodParams);
  }

  decodeABICallParameters(types: Array<AbiOutput | string>, callData: string): AbiDecodeResult {
    return this.#abiCoder.decode(types as Array<string>, callData);
  }

  decodeABIParameter<T>(type: AbiOutput | string, hex: string): T {
    return this.#abiCoder.decode([type as string], hex)[0] as T;
  }

  ethCall(contractAddress: string, callData: string): Promise<string> {
    return this.#web3Provider.call({ to: contractAddress, data: callData });
  }

  signTypedData(walletAddress: string, typedData: EIP712TypedData, typedDataHash: string): Promise<string> {
    return this.#signer._signTypedData(typedData.domain, typedData.types, typedData.message);
  }
}
