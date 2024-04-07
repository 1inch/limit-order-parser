"use client"
import React from "react";
import {useForm} from "react-hook-form";
import {LimitOrder, LimitOrderBuilder, ZERO_ADDRESS, ZX} from "@1inch/limit-order-protocol-utils";
import {getLimitOrderBuilder, getWeb3Data} from "@/app/helpers/helpers";
import {omit} from "next/dist/shared/lib/router/utils/omit";

type CreateMakerTraits = NonNullable<Parameters<typeof LimitOrderBuilder.buildMakerTraits>[0]>;

type CreateMakerTraitsForm = Omit<CreateMakerTraits, 'series' | 'nonce'> & {
    nonce?: number;
    series?: number;
}

type ExtensionParams = NonNullable<Parameters<LimitOrderBuilder['buildLimitOrder']>[1]>;

type CreateOrderForm = Omit<LimitOrder, 'makerTraits' | 'salt' | 'maker'> & {
    salt?: LimitOrder['salt'],
    makerTraits: CreateMakerTraitsForm,
    extension: ExtensionParams;
}

type CreatedOrderForm = LimitOrder & {
    extension: string;
    signature: string;
    order: string;
}

const DEFAULT_FORM_VALUE: CreateOrderForm = {
    makerAsset: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    takerAsset: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
    makingAmount: '2000000',
    takingAmount: '2000000000000000000',
    receiver: ZERO_ADDRESS,
    makerTraits: {
        allowPartialFill: true,
        allowMultipleFills: true,
        allowPriceImprovement: true,
    },
    extension: {
        permit: ZX,
        predicate: ZX,
        postInteraction: ZX,
    }
}

export default function Builder() {
    const orderForm = useForm<CreateOrderForm>({
        defaultValues: DEFAULT_FORM_VALUE,
    });

    const createdOrderForm = useForm<CreatedOrderForm>();

    async function createOrder(fields: CreateOrderForm): Promise<void> {
        const builder = getLimitOrderBuilder();
        const { maker, networkId, contractAddress } = await getWeb3Data();
        if (!maker) {
            alert('Wallet wasnt connected');
            return;
        }

        const orderData = omit(fields, ['makerTraits']);

        const { nonce, series } = fields.makerTraits;
        const makerTraits = LimitOrderBuilder.buildMakerTraits({
            ...omit(fields.makerTraits, ['nonce', 'series']),
            nonce: nonce ? BigInt(nonce) : undefined,
            series: series ? BigInt(series) : undefined,
        });

        const order = builder.buildLimitOrder({
            ...orderData,
            makerTraits,
            maker,
        });

        const signature = await builder.buildTypedDataAndSign(
            order,
            BigInt(networkId),
            contractAddress,
            maker
        );

        createdOrderForm.reset({
            order: JSON.stringify(order),
            extension: order.extension,
            signature,
        })
    }

    return (
        <div>
          Will be soon
            {/*<form  onSubmit={orderForm.handleSubmit((data) => createOrder(data))}>*/}
            {/*    <div className="grid grid-cols-1 gap-1">*/}
            {/*        <div className="field-container w-full flex">*/}
            {/*            <label htmlFor="makerAsset">makerAsset: </label>*/}
            {/*            <input id="makerAsset"*/}
            {/*                   className="flex-1"*/}
            {/*                   {...orderForm.register('makerAsset')}></input>*/}
            {/*        </div>*/}
            {/*        <div className="field-container w-full flex">*/}
            {/*            <label htmlFor="takerAsset">takerAsset: </label>*/}
            {/*            <input id="takerAsset"*/}
            {/*                   className="flex-1"*/}
            {/*                   {...orderForm.register('takerAsset')}></input>*/}
            {/*        </div>*/}
            {/*        <div className="field-container w-full flex">*/}
            {/*            <label htmlFor="makingAmount">makingAmount: </label>*/}
            {/*            <input id="makingAmount"*/}
            {/*                   className="flex-1"*/}
            {/*                   {...orderForm.register('makingAmount')}></input>*/}
            {/*        </div>*/}
            {/*        <div className="field-container w-full flex">*/}
            {/*            <label htmlFor="takingAmount">takingAmount: </label>*/}
            {/*            <input id="takingAmount"*/}
            {/*                   className="flex-1"*/}
            {/*                   {...orderForm.register('takingAmount')}></input>*/}
            {/*        </div>*/}
            {/*        <div className="field-container w-full flex">*/}
            {/*            <label htmlFor="makerAsset">receiver: </label>*/}
            {/*            <input id="receiver"*/}
            {/*                   className="flex-1"*/}
            {/*                   {...orderForm.register('receiver')}></input>*/}
            {/*        </div>*/}
            {/*    </div>*/}

            {/*    <div className="border p-1">*/}
            {/*        <h5>Maker traits:</h5>*/}
            {/*        <div className="field-container">*/}
            {/*            <label htmlFor="makerTraits.shouldCheckEpoch">Should check epoch</label>*/}
            {/*            <input type="checkbox"*/}
            {/*                   {...orderForm.register('makerTraits.shouldCheckEpoch')}*/}
            {/*                   id="makerTraits.shouldCheckEpoch"></input>*/}
            {/*        </div>*/}

            {/*        <div className="field-container">*/}
            {/*            <label htmlFor="makerTraits.allowPartialFill">Allow partial fill</label>*/}
            {/*            <input type="checkbox"*/}
            {/*                   {...orderForm.register('makerTraits.allowPartialFill')}*/}
            {/*                   id="makerTraits.allowPartialFill"></input>*/}
            {/*        </div>*/}

            {/*        <div className="field-container">*/}
            {/*            <label htmlFor="makerTraits.allowPriceImprovement">Allow price improvement</label>*/}
            {/*            <input type="checkbox"*/}
            {/*                   {...orderForm.register('makerTraits.allowPriceImprovement')}*/}
            {/*                   id="makerTraits.allowPriceImprovement"></input>*/}
            {/*        </div>*/}

            {/*        <div className="field-container">*/}
            {/*            <label htmlFor="makerTraits.allowMultipleFills">Allow multiple fields</label>*/}
            {/*            <input type="checkbox"*/}
            {/*                   {...orderForm.register('makerTraits.allowMultipleFills')}*/}
            {/*                   id="makerTraits.allowMultipleFills"></input>*/}
            {/*        </div>*/}

            {/*        <div className="field-container">*/}
            {/*            <label htmlFor="makerTraits.usePermit2">Permit 2</label>*/}
            {/*          <input type="checkbox"*/}
            {/*                 {...orderForm.register('makerTraits.usePermit2')}*/}
            {/*                 id="makerTraits.usePermit2"></input>*/}
            {/*        </div>*/}

            {/*        <div className="field-container">*/}
            {/*            <label htmlFor="makerTraits.unwrapWeth">Unwrap WETH</label>*/}
            {/*          <input type="checkbox"*/}
            {/*                 {...orderForm.register('makerTraits.unwrapWeth')}*/}
            {/*                 id="makerTraits.unwrapWeth"></input>*/}
            {/*        </div>*/}

            {/*        <div className="field-container">*/}
            {/*            <label htmlFor="makerTraits.expiry">Expiry</label>*/}
            {/*            <input {...orderForm.register('makerTraits.expiry')}*/}
            {/*                   id="makerTraits.expiry"></input>*/}
            {/*        </div>*/}

            {/*        <div className="field-container">*/}
            {/*            <label htmlFor="makerTraits.nonce">Nonce</label>*/}
            {/*            <input {...orderForm.register('makerTraits.nonce')}*/}
            {/*                   id="makerTraits.nonce"></input>*/}
            {/*        </div>*/}

            {/*        <div className="field-container">*/}
            {/*            <label htmlFor="makerTraits.series">Series</label>*/}
            {/*            <input {...orderForm.register('makerTraits.series')}*/}
            {/*                   id="makerTraits.series"></input>*/}
            {/*        </div>*/}
            {/*    </div>*/}

            {/*  <div className="border p-1">*/}
            {/*    <h5>Extension:</h5>*/}
            {/*    <div className="field-container">*/}
            {/*      <label htmlFor="extension.permit">Permit: </label>*/}
            {/*      <input type="text"*/}
            {/*             {...orderForm.register('extension.permit')}*/}
            {/*             id="makerTraits.permit"></input>*/}
            {/*    </div>*/}

            {/*    <div className="field-container">*/}
            {/*      <label htmlFor="extension.predicate">Predicate:</label>*/}
            {/*      <input type="text"*/}
            {/*             {...orderForm.register('extension.predicate')}*/}
            {/*             id="makerTraits.predicate"></input>*/}
            {/*    </div>*/}

            {/*    <div className="field-container">*/}
            {/*      <label htmlFor="extension.postInteraction">Post interaction:</label>*/}
            {/*      <input type="text"*/}
            {/*             {...orderForm.register('extension.postInteraction')}*/}
            {/*             id="makerTraits.predicate"></input>*/}
            {/*    </div>*/}
            {/*  </div>*/}

            {/*    <button type="submit">Create and subscribe</button>*/}
            {/*</form>*/}

            {/*<form>*/}
            {/*    <div className="grid grid-cols-1 gap-1 p-10">*/}
            {/*        <div className="field-container w-full flex">*/}
            {/*            <textarea*/}
            {/*                className="flex-1"*/}
            {/*                {...createdOrderForm.register('order')}></textarea>*/}
            {/*        </div>*/}
            {/*        <div className="field-container w-full flex">*/}
            {/*            <label htmlFor="signature">signature: </label>*/}
            {/*            <input id="signature"*/}
            {/*                   className="flex-1"*/}
            {/*                   {...createdOrderForm.register('signature')}></input>*/}
            {/*        </div>*/}
            {/*        <div className="field-container w-full flex">*/}
            {/*            <label htmlFor="signature">extension: </label>*/}
            {/*            <input id="extension"*/}
            {/*                   className="flex-1"*/}
            {/*                   {...createdOrderForm.register('extension')}></input>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*</form>*/}
        </div>
    )
}
