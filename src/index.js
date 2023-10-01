import {
    LimitOrderDecoder,
    ZX,
    LimitOrderPredicateDecoder,
    Web3ProviderConnector,
    LimitOrderProtocolFacade,
    LimitOrderBuilder,
    fillWithMakingAmount,
    LimitOrderProtocolV3Facade,
    PROTOCOL_NAME,
    PROTOCOL_VERSION,
    ORDER_STRUCTURE,
} from '@1inch/limit-order-protocol-utils'
import Web3 from 'web3';
import { get } from 'lodash';
import {AuctionSalt, AuctionSuffix, buildOrderData} from "@1inch/fusion-sdk";
import V3ABI from './abi/LimitOrderProtocolV3.json'
import SeriesNonceABI from './abi/SeriesNonceManagerABI.json'

import './main.css';

export const ethereumMainContracts = {
    limitOrder: '0x1111111254eeb25477b68fb85ed929f73a960582',
    loSeriesNonceManager: '0x303389f541ff2d620e42832f180a08e767b28e1',
};

export const binanceMainContracts = {
    limitOrder: '0x1111111254eeb25477b68fb85ed929f73a960582',
    loSeriesNonceManager: '0x58ce0e6ef670c9a05622f4188faa03a9e12ee2e4',
};

export const polygonMainContracts = {
    limitOrder: '0x391f535454488181549d9613b8964ee683ef77e5',
    loSeriesNonceManager: '0x58ce0e6ef670c9a05622f4188faa03a9e12ee2e4',
};

const addressMap = new Map([
    [1, ethereumMainContracts],
    [56, binanceMainContracts],
    [137, polygonMainContracts]
])

let web3;
let facade;

async function  connectWeb3() {
    if (web3) {
        return;
    }

    if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);
        try {
            await window.ethereum.enable();
        } catch (error) {
            console.error('User denied account access', error);
        }
    } else {
        console.error('Please install MetaMask');
    }
}

async function getContractData() {
    await connectWeb3();
    const networkId = await web3.eth.net.getId();
    const contractAddress = addressMap.get(networkId).limitOrder;

    return {
        networkId,
        contractAddress
    }
}

async function getLimitOrderFacade() {
    const { networkId, contractAddress } = await getContractData();
    return getLimitOrderProtocolFacade(networkId, contractAddress);
}

async function getLimitOrderFacadeV3() {
    const { networkId, contractAddress } = await getContractData();
    const connector = getProvideConnector();
    return  new LimitOrderProtocolV3Facade(
        contractAddress, networkId, connector
    );
}

function getOrder() {
    const orderField = document.querySelector('#order')
    return JSON.parse(orderField.value);
}

async function parseOrder() {
    const parsed = getOrder();

    // parse the limit order v3
    if (!parsed.makerTraits && parsed.interaction !== ZX) {
        const result = LimitOrderDecoder.unpackInteractionsV3(parsed.offsets, parsed.interactions);
        for (const field of Object.keys(result)) {
            const fieldElement = document.querySelector(`#${field}`);
            if (fieldElement) {
                fieldElement.value = result[field];
            }
        }

        const { networkId } = await getContractData();

        debugger
        const limitOrderPredicateDecoder = new LimitOrderPredicateDecoder(
            networkId,
            V3ABI,
            SeriesNonceABI,
        );

        if (result.predicate && result.predicate !== ZX) {
            facade = await getLimitOrderFacadeV3();

            const isValid = await checkPredicate(parsed)
            const validField = document.querySelector(`#check-predicate`);
            validField.value = isValid;

            const ast = limitOrderPredicateDecoder.decode(result.predicate);

            const { nonce, timestamp, series } = getExpiration(
                limitOrderPredicateDecoder,
                ast,
            );

            const timestampField = document.querySelector(`#timestamp`);
            if (timestampField && timestamp) {
                timestampField.value = (new Date(timestamp * 1000))
            }

            const nonceField = document.querySelector(`#nonce`);
            if (nonceField && !isNaN(nonce)) {
                nonceField.value = nonce;
            }

            const seriesField = document.querySelector(`#series`);
            if (seriesField && !isNaN(series)) {
                seriesField.value = series;
            }
        }
    } else if (!!parsed.makerTraits) {

    } else {
        alert('Order has incorrect structure');
    }
}

async function checkPredicate(order) {
    return facade.checkPredicate(order);
}

function getInputValue(inputId, parser = value => value) {
    const value = document.querySelector(`#${inputId}`).value;
    return parser(value);
}


function getLimitOrderProtocolFacade(chainId, contractAddress) {
    const connector = getProvideConnector();
    return  new LimitOrderProtocolFacade(
        contractAddress, chainId, connector
    );
}

function getProvideConnector() {
    return new Web3ProviderConnector(web3)
}

export function getExpiration(
    limitOrderPredicateDecoder,
    predicate,
) {
    const matcher = (node) => {
        if (
            node.type === 'function'
            && 'name' in node
            && ['timestampBelow', 'timestampBelowAndNonceEquals'].includes(node.name)
    ) return true;

        return false;
    };


    const node = limitOrderPredicateDecoder.findFirstDFS(predicate, matcher);

    if (!node) {
        throw new Error('No nonce predicate found in order.');
    }

    return  {
        timestamp: +get(node, 'args.timestamp.bytes'),
        nonce: +get(node, 'args.nonce.bytes'),
        series: +get(node, 'args.series.bytes')
    };
}

async function getLimitOrderBuilder() {
    const { networkId, contractAddress } = await getContractData();

    const builder = new LimitOrderBuilder(
        createProviderConnector(),
        {
            domainName: PROTOCOL_NAME,
            version: PROTOCOL_VERSION,
        }
    );
    return builder;
}

function createProviderConnector() {
    const ethereum = window.ethereum;
    return {
        signTypedData(
            walletAddress,
            typedData,
            dataHash,
        ) {
            return ethereum.request({
                "method": "eth_signTypedData_v4",
                "params": [
                    walletAddress,
                    typedData
                ]
            })
        }
    }
}

async function createOrder() {
    const builder = await getLimitOrderBuilder();
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const maker = accounts[0];

    const makerAsset = getInputValue('maker-token')
    const takerAsset = getInputValue('taker-token')
    const makerAmount = getInputValue('maker-amount')
    const takerAmount = getInputValue('taker-amount')

    const order = builder.buildLimitOrder({
        maker,
        makerAsset,
        takerAsset,
        makingAmount: makerAmount,
        takingAmount: takerAmount,
    }, {});

    const textArea = document.querySelector('#order');
    textArea.value = JSON.stringify(order.order)

    const extension = document.querySelector('#extension');
    extension.value = order.extension
}

async function signLimitOrder() {
    const { networkId, contractAddress } = await getContractData();
    const builder = await getLimitOrderBuilder();
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const maker = accounts[0]
    const order = getOrder();
    if (!order) {
        alert('There is no order');
    }

    const typedData = builder.buildLimitOrderTypedData(order, networkId, contractAddress);
    const signature = await builder.buildOrderSignature(maker, typedData);
    const signatureField = document.querySelector('#signature');
    signatureField.value = signature;
}

async function fillOrder() {
    const limitOrderFacade = await getLimitOrderFacade();
    const makingAmount = prompt("Making amount:");
    const takingAmount = prompt("Taking amount:");
    // if (makingAmount && takingAmount) {
    //     alert("Only one value should be entered")
    // }

    const order = getOrder();
    if (!order) {
        alert("There is no order in the text area")
    }
    const amount = (+makingAmount) || (+takingAmount);
    const signature = document.querySelector('#signature').value;

    const calldata = limitOrderFacade.fillLimitOrder({
        order: order,
        amount: amount.toString(),
        signature,
        takerTraits: fillWithMakingAmount(BigInt(amount))
    });

    const txHash = await sendTransaction(calldata);
    alert(txHash)
}

async function sendTransaction(calldata) {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const walletAddress = accounts[0];
    const { contractAddress } = await getContractData();

    const gasLimit = await estimateGas(walletAddress, contractAddress);

    const tx = {
        to: contractAddress,
        from: walletAddress,
        gas: gasLimit,
        data: calldata
    };

    try {
        const txHash = await window.web3.eth.sendTransaction(tx);
        console.log('Transaction Hash:', txHash);
    } catch (error) {
        console.error('Error occurred:', error);
    }
}

async function estimateGas(walletAddress, contractAddress, calldata) {
    const tx = {
        to: contractAddress,
        from: walletAddress,
        data: calldata
    };

    return await web3.eth.estimateGas(tx);
}

document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('#parseOrderBtn');
    button.addEventListener('click', parseOrder);

    const createOrderBtn = document.querySelector('#create-order');
    createOrderBtn.addEventListener('click', createOrder);

    const parseFusionOrderBtn = document.querySelector('#parseFusionOrderBtn');
    parseFusionOrderBtn.addEventListener('click', parseFusionOrder);

    const signOrderBtn = document.querySelector('#signOrder');
    signOrderBtn.addEventListener('click', signLimitOrder);

    const fillOrderBtn = document.querySelector('#fillOrder');
    fillOrderBtn.addEventListener('click', fillOrder);
});

async function parseFusionOrder() {
    const orderTextArea = document.querySelector('#fuison-order')
    const order = JSON.parse(orderTextArea.value);

    const decodedSalt = AuctionSalt.decode(order.salt);
    document.getElementById("fusionSalt").innerHTML = JSON.stringify(decodedSalt);

    const decodedSuffix = AuctionSuffix.decode(order.interactions);
    document.getElementById("fusionInteractions").innerHTML = JSON.stringify(decodedSuffix);
}
