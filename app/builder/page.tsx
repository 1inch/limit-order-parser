"use client"
import React from "react";
import {Controller, FieldValues, useForm} from "react-hook-form";
import {LimitOrder, ZERO_ADDRESS} from "@1inch/limit-order-protocol-utils";
import {getLimitOrderBuilder, getWeb3Data} from "@/app/helpers/helpers";

type CreateOrderForm = Omit<LimitOrder, 'makerTraits' | 'salt' | 'maker'> & {
    salt?: Pick<LimitOrder, 'salt'>['salt'],
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
}

export default function Builder() {
    const orderForm = useForm<CreateOrderForm>({
        defaultValues: DEFAULT_FORM_VALUE,
    });

    const createdOrderForm = useForm<CreatedOrderForm>()

    async function createOrder(fields: CreateOrderForm): Promise<void> {
        const builder = getLimitOrderBuilder();
        const { maker, networkId, contractAddress } = await getWeb3Data();
        if (!maker) {
            alert('Wallet wasnt connected');
            return;
        }

        const order = builder.buildLimitOrder({
            ...fields,
            maker,
        });

        const signature = await builder.buildTypedDataAndSign(
            order.order,
            networkId,
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
            <form  onSubmit={orderForm.handleSubmit((data) => createOrder(data))}>
                <div className="grid grid-cols-1 gap-1 p-10">
                    <div className="field-container w-full flex">
                        <label htmlFor="makerAsset">makerAsset: </label>
                        <input id="makerAsset"
                               className="flex-1"
                               {...orderForm.register('makerAsset')}></input>
                    </div>
                    <div className="field-container w-full flex">
                        <label htmlFor="makerAsset">makerAsset: </label>
                        <input id="makerAsset"
                               className="flex-1"
                               {...orderForm.register('takerAsset')}></input>
                    </div>
                    <div className="field-container w-full flex">
                        <label htmlFor="takerAsset">takerAsset: </label>
                        <input id="takerAsset"
                               className="flex-1"
                               {...orderForm.register('takerAsset')}></input>
                    </div>
                    <div className="field-container w-full flex">
                        <label htmlFor="makingAmount">makingAmount: </label>
                        <input id="makingAmount"
                               className="flex-1"
                               {...orderForm.register('makingAmount')}></input>
                    </div>
                    <div className="field-container w-full flex">
                        <label htmlFor="takingAmount">takingAmount: </label>
                        <input id="takingAmount"
                               className="flex-1"
                               {...orderForm.register('takingAmount')}></input>
                    </div>
                    <div className="field-container w-full flex">
                        <label htmlFor="makerAsset">receiver: </label>
                        <input id="receiver"
                               className="flex-1"
                               {...orderForm.register('receiver')}></input>
                    </div>
                </div>

                <button>Create and subscribe</button>
            </form>

            <form>
                <div className="grid grid-cols-1 gap-1 p-10">
                    <div className="field-container w-full flex">
                        <textarea
                            className="flex-1"
                            {...createdOrderForm.register('order')}></textarea>
                    </div>
                    <div className="field-container w-full flex">
                        <label htmlFor="signature">signature: </label>
                        <input id="signature"
                               className="flex-1"
                               {...createdOrderForm.register('signature')}></input>
                    </div>
                    <div className="field-container w-full flex">
                        <label htmlFor="signature">extension: </label>
                        <input id="extension"
                               className="flex-1"
                               {...createdOrderForm.register('extension')}></input>
                    </div>
                </div>
            </form>
        </div>
    )
}
