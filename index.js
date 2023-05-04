import { LimitOrderDecoder, ZX, LimitOrderPredicateDecoder } from '@1inch/limit-order-protocol-utils'
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

let web3;

const testedData = {
        "salt": "270063368253",
        "makerAsset": "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3",
        "takerAsset": "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
        "maker": "0x6ab9c477246bcaa4a1c3a825f42437ef66c55953",
        "receiver": "0x0000000000000000000000000000000000000000",
        "allowedSender": "0x0000000000000000000000000000000000000000",
        "makingAmount": "1000000000000000000",
        "takingAmount": "3074476000000000",
        "offsets": "4421431254442149611168492388118363282642987198110904030635476664713216",
        "interactions": "0xbf15fcd800000000000000000000000058ce0e6ef670c9a05622f4188faa03a9e12ee2e4000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000242cc2878d00645550dc000000000000006ab9c477246bcaa4a1c3a825f42437ef66c5595300000000000000000000000000000000000000000000000000000000"
    };

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
    orderField.value = JSON.stringify(testedData);
    const parsed = JSON.parse(orderField.value);

    const result = LimitOrderDecoder.unpackInteractions(parsed.offsets, parsed.interactions);
    for (const field of Object.keys(result)) {
        const fieldElement = document.querySelector(`#${field}`);
        if (fieldElement) {
            fieldElement.value = result[field];
        }
    }

    const limitOrderPredicateDecoder = new LimitOrderPredicateDecoder(networkId);

    if (result.predicate && result.predicate !== ZX) {
        const ast = limitOrderPredicateDecoder.decode(result.predicate);

        const { nonce, timestamp } = getExpiration(
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
    }
}

export function getExpiration(
    limitOrderPredicateDecoder,
    predicate,
    nonceManagerAddress,
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

    debugger
    if (!node) {
        throw new Error('No nonce predicate found in order.');
    }

    return  {
        timestamp: +get(node, 'args.timestamp.bytes'),
        nonce: +get(node, 'args.nonce.bytes'),
    };
}


document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('#parseOrderBtn');
    button.addEventListener('click', parseOrder);
});


