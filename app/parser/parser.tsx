import {Controller, FieldValues, useForm} from "react-hook-form";
import {LimitOrder, LimitOrderDecoder} from "@1inch/limit-order-protocol-utils";
import {omit} from "next/dist/shared/lib/router/utils/omit";
import {FormattedMakerTraits, getLimitOrderFacade} from "@/app/parser/helpers/helpers";
import React from "react";

const orderMock = {
    "salt": "24772380956908715502473767112441541420167429817584581067853599066994352650684",
    "maker": "0xcd4060fa7b5164281f150fa290181401524ef76f",
    "receiver": "0x0000000000000000000000000000000000000000",
    "makerAsset": "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    "takerAsset": "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
    "makingAmount": "2000000",
    "takingAmount": "2000000000000000000",
    "makerTraits": "0x40000000000000000000000000000000000065231de700000000000000000000",
    "extension": "0x"
}

type ParsedOrder = Pick<LimitOrder, 'makerAsset' | 'takerAsset' | 'makingAmount' | 'takingAmount'> & {
    parsedMakerTraits: FormattedMakerTraits;
    orderHash: string;
    extension: string;
    parsedExtension: {}
}

export default function Parser() {
    const orderForm = useForm<{ order: string }>();
    const parsedOrderForm = useForm<ParsedOrder>();

    async function parseOrder(data: FieldValues) {
        let order: LimitOrder & { extension: string } | null = null;
        try {
            order = JSON.parse(data.order);
        } catch (e) {
            alert(`Can't parse order`);
        }

        if (!order) {
            return;
        }

        const parsedMakerTraits = LimitOrderDecoder.unpackMakerTraits(order.makerTraits);
        const formattedMakerTraits = {
            ...omit(parsedMakerTraits as any, ['nonce', 'series']),
            nonce: Number(parsedMakerTraits.nonce),
            series: Number(parsedMakerTraits.series),
        } as FormattedMakerTraits;
        console.log('parsedMakerTraits: ', parsedMakerTraits);

        const facade = await getLimitOrderFacade();

        const orderHash = await facade.orderHash(order);

        // const parsedExtension = LimitOrderDecoder.unpackExtension(order.extension);

        const { reset } = parsedOrderForm;
        reset({
            ...order,
            orderHash,
            parsedMakerTraits: formattedMakerTraits,
            extension: order.extension,
            // parsedExtension,
        });
    }

    return (
        <>
            <form className="grid grid-cols-1 gap-1 p-10" onSubmit={orderForm.handleSubmit((data) => parseOrder(data))}>
                <div className="flex flex-col gap-10">
            <textarea className="order-field"
                      defaultValue={JSON.stringify(orderMock)}
                      {...orderForm.register('order')}
                      placeholder="Put order structure here"
            ></textarea>
                    <button type="submit">Parse</button>
                </div>
            </form>

            <div className="grid grid-cols-1 gap-1 p-10">
                <div className="w-full flex">
                    <label htmlFor="makerAsset">makerAsset: </label>
                    <input id="makerAsset"
                           className="flex-1"
                           {...parsedOrderForm.register('makerAsset')}></input>
                </div>
                <div className="field-container w-full flex">
                    <label htmlFor="takerAsset">takerAsset: </label>
                    <input className="flex-1"
                           id="takerAsset"
                           {...parsedOrderForm.register('takerAsset')}></input>
                </div>
                <div className="field-container w-full flex">
                    <label htmlFor="orderHash">orderHash: </label>
                    <input className="flex-1"
                           id="orderHash"
                           {...parsedOrderForm.register('orderHash')}></input>
                </div>

                <div className="border p-1">
                    <h5>Maker traits:</h5>
                    <div className="field-container w-full flex">
                        <label htmlFor="parsedMakerTraits.allowedSender">Allowed sender: </label>
                        <Controller
                            name="parsedMakerTraits.allowedSender"
                            control={parsedOrderForm.control}
                            defaultValue=""
                            render={({ field }) => (
                                <input id="parsedMakerTraits.allowedSender"
                                       className="flex-1"
                                       {...field} placeholder="Allowed sender" />
                            )}
                        />
                    </div>

                    <div className="field-container">
                        <label htmlFor="parsedMakerTraits.shouldCheckEpoch">Should check epoch</label>
                        <Controller
                            name="parsedMakerTraits.shouldCheckEpoch"
                            control={parsedOrderForm.control}
                            defaultValue={false}
                            render={({ field }) => (
                                <input type="checkbox"
                                       checked={field.value}
                                       id="parsedMakerTraits.shouldCheckEpoch" value="false"></input>
                            )}
                        />
                    </div>

                    <div className="field-container">
                        <label htmlFor="parsedMakerTraits.allowPartialFill">Allow partial fill</label>
                        <Controller
                            name="parsedMakerTraits.allowPartialFill"
                            control={parsedOrderForm.control}
                            defaultValue={false}
                            render={({ field }) => (
                                <input type="checkbox"
                                       checked={field.value}
                                       id="parsedMakerTraits.allowPartialFill" value="false"></input>
                            )}
                        />
                    </div>

                    <div className="field-container">
                        <label htmlFor="parsedMakerTraits.allowPriceImprovement">Allow price improvement</label>
                        <Controller
                            name="parsedMakerTraits.allowPriceImprovement"
                            control={parsedOrderForm.control}
                            defaultValue={false}
                            render={({ field }) => (
                                <input type="checkbox"
                                       checked={field.value}
                                       id="parsedMakerTraits.allowPriceImprovement" value="false"></input>
                            )}
                        />
                    </div>

                    <div className="field-container">
                        <label htmlFor="parsedMakerTraits.allowMultipleFills">Allow multiple fields</label>
                        <Controller
                            name="parsedMakerTraits.allowMultipleFills"
                            control={parsedOrderForm.control}
                            defaultValue={false}
                            render={({ field }) => (
                                <input type="checkbox"
                                       checked={field.value}
                                       id="parsedMakerTraits.allowMultipleFills" value="false"></input>
                            )}
                        />
                    </div>

                    <div className="field-container">
                        <label htmlFor="parsedMakerTraits.usePermit2">Permit 2</label>
                        <Controller
                            name="parsedMakerTraits.usePermit2"
                            control={parsedOrderForm.control}
                            defaultValue={false}
                            render={({ field }) => (
                                <input type="checkbox"
                                       checked={field.value}
                                       id="parsedMakerTraits.usePermit2" value="false"></input>
                            )}
                        />
                    </div>

                    <div className="field-container">
                        <label htmlFor="parsedMakerTraits.unwrapWeth">Unwrap WETH</label>
                        <Controller
                            name="parsedMakerTraits.unwrapWeth"
                            control={parsedOrderForm.control}
                            defaultValue={false}
                            render={({ field }) => (
                                <input type="checkbox"
                                       checked={field.value}
                                       id="parsedMakerTraits.unwrapWeth" value="false"></input>
                            )}
                        />
                    </div>

                    <div className="field-container">
                        <label htmlFor="parsedMakerTraits.expiry">Expiry</label>
                        <Controller
                            name="parsedMakerTraits.expiry"
                            control={parsedOrderForm.control}
                            render={({ field }) => (
                                <input id="parsedMakerTraits.expiry" {...field}></input>
                            )}
                        />
                    </div>

                    <div className="field-container">
                        <label htmlFor="parsedMakerTraits.nonce">Nonce</label>
                        <Controller
                            name="parsedMakerTraits.nonce"
                            control={parsedOrderForm.control}
                            render={({ field }) => (
                                <input id="parsedMakerTraits.nonce" {...field}></input>
                            )}
                        />
                    </div>

                    <div className="field-container">
                        <label htmlFor="parsedMakerTraits.series">Series</label>
                        <Controller
                            name="parsedMakerTraits.series"
                            control={parsedOrderForm.control}
                            render={({ field }) => (
                                <input id="parsedMakerTraits.series" {...field}></input>
                            )}
                        />
                    </div>
                </div>

                <div className="border p-1">
                    <div className="field-container">
                        <label htmlFor="takerAsset">Extension: </label>
                        <input className="flex-1"
                               id="extension"
                               {...parsedOrderForm.register('extension')}></input>
                    </div>
                </div>
            </div>
        </>
    );
}
