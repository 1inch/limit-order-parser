import {
    LimitOrderDecoder,
    ZX,
    LimitOrderPredicateDecoder,
    Web3ProviderConnector, LimitOrderProtocolFacade
} from '@1inch/limit-order-protocol-utils'
import Web3 from 'web3';
import { get } from 'lodash';

export const ethereumMainContracts = {
    limitOrder: '0x1111111254eeb25477b68fb85ed929f73a960582',
    loSeriesNonceManager: '0x303389f541ff2d620e42832f180a08e767b28e1',
};

export const binanceMainContracts = {
    limitOrder: '0x1111111254eeb25477b68fb85ed929f73a960582',
    loSeriesNonceManager: '0x58ce0e6ef670c9a05622f4188faa03a9e12ee2e4',
};

const addressMap = new Map([
    [1, ethereumMainContracts],
    [56, binanceMainContracts]
])

let web3;
let facade;

async function  connectWeb3() {
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

async function parseOrder() {
    await connectWeb3();
    const networkId = await web3.eth.net.getId();

    const orderField = document.querySelector('#order')
    const parsed = JSON.parse(orderField.value);

    if (parsed.interaction !== ZX) {
        const result = LimitOrderDecoder.unpackInteractions(parsed.offsets, parsed.interactions);
        for (const field of Object.keys(result)) {
            const fieldElement = document.querySelector(`#${field}`);
            if (fieldElement) {
                fieldElement.value = result[field];
            }
        }

        const limitOrderPredicateDecoder = new LimitOrderPredicateDecoder(networkId);

        if (result.predicate && result.predicate !== ZX) {
            const contractAddress = addressMap.get(networkId).limitOrder;
            facade = getLimitOrderProtocolFacade(networkId, contractAddress);
            const success = await simulateResult(contractAddress, result.predicate);
            if (typeof success === 'boolean') {
                const validField = document.querySelector(`#simulate-result`);
                validField.value = success;
            }

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
    } else {
        alert('Interaction is empty!')
    }
}

async function checkPredicate(order) {
    return facade.checkPredicate(order);
}

async function simulateResult(contractAddress, predicate) {
    try {
        const { success } = await facade.simulate(contractAddress, predicate);
        return success;
    } catch (e) {
        return false;
    }
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


document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('#parseOrderBtn');
    button.addEventListener('click', parseOrder);
});


