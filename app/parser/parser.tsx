import {Controller, FieldValues, useForm} from "react-hook-form";
import { LimitOrder, LimitOrderBuilder, LimitOrderDecoder, ZX } from "@1inch/limit-order-protocol-utils";
import {FormattedMakerTraits, getLimitOrderFacade} from "@/app/helpers/helpers";
import {omit} from "next/dist/shared/lib/router/utils/omit";
import React from "react";

const ethereumOrderMockWithPredicate = {
  "salt": "189791213515228772493723881274800954614876732216",
  "maker": "0xcd4060fa7b5164281f150fa290181401524ef76f",
  "receiver": "0x0000000000000000000000000000000000000000",
  "makerAsset": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  "takerAsset": "0x6b175474e89094c44da98b954eedeac495271d0f",
  "makingAmount": "3000000",
  "takingAmount": "3000000000000000000",
  "makerTraits": "0x420000000000000000000000000000000000654d4ee100000000000000000000",
  "extension": "0x000000f4000000f4000000f40000000000000000000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000cd4060fa7b5164281f150fa290181401524ef76f000000000000000000000000c6f9b19e2e91a8cd3b7ff62aa68e4de8f7cdddbcffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000654d4edb000000000000000000000000000000000000000000000000000000000000001bc772358d7d01f6823a0ace7d5b90dedd996c738c92368d49fe01744d68506807108479337967b5b549891e174ffece7b2414c041962d27b8b441600aaed51782"
}

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
};

type CreateExtensionParams = NonNullable<Parameters<LimitOrderBuilder['buildLimitOrder']>[1]>;
type ExtensionParams = Required<CreateExtensionParams>;

type ParsedOrder = Pick<LimitOrder, 'makerAsset' | 'takerAsset' | 'makingAmount' | 'takingAmount'> & {
    parsedMakerTraits: FormattedMakerTraits;
    orderHash: string;
    extension: string;
    parsedExtension: ExtensionParams;
}

const defaultExtension: ExtensionParams = {
  makingAmountGetter: ZX,
  takingAmountGetter: ZX,
  permit: ZX,
  customData: ZX,
  predicate: ZX,
  postInteraction: ZX,
  preInteraction: ZX,
  makerAssetSuffix: ZX,
  takerAssetSuffix: ZX
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

        const facade = await getLimitOrderFacade();

        const orderHash = await facade.orderHash(order);

        const parsedExtension = order.extension !== ZX
          ? LimitOrderDecoder.unpackExtension(order.extension)
          : { customData: ZX, interactions: {...defaultExtension} };

        const extensionData: ExtensionParams =  {
          ...defaultExtension,
          ...parsedExtension.interactions,
          customData: parsedExtension.customData,
        };

        const { reset } = parsedOrderForm;
        reset({
            ...order,
            orderHash,
            parsedMakerTraits: formattedMakerTraits,
            extension: order.extension,
            parsedExtension: extensionData,
        });
    }

    return (
        <>
            <form className="grid grid-cols-1 gap-1 p-10" onSubmit={orderForm.handleSubmit((data) => parseOrder(data))}>
                <div className="flex flex-col gap-10">
            <textarea className="order-field"
                      defaultValue={JSON.stringify(ethereumOrderMockWithPredicate)}
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
                           readOnly
                           {...parsedOrderForm.register('makerAsset')}></input>
                </div>
                <div className="field-container w-full flex">
                    <label htmlFor="takerAsset">takerAsset: </label>
                    <input className="flex-1"
                           id="takerAsset"
                           readOnly
                           {...parsedOrderForm.register('takerAsset')}></input>
                </div>
                <div className="field-container w-full flex">
                    <label htmlFor="orderHash">orderHash: </label>
                    <input className="flex-1"
                           id="orderHash"
                           readOnly
                           {...parsedOrderForm.register('orderHash')}></input>
                </div>

                <div className="border p-1">
                    <h5>Maker traits:</h5>
                    <div className="field-container">
                        <label htmlFor="parsedMakerTraits.allowedSender">Allowed sender: </label>
                        <Controller
                            name="parsedMakerTraits.allowedSender"
                            control={parsedOrderForm.control}
                            render={({ field }) => (
                                <input id="parsedMakerTraits.allowedSender"
                                       className="flex-1"
                                       readOnly
                                       {...field} placeholder="Allowed sender" />
                            )}
                        />
                    </div>

                    <div className="field-container">
                        <label htmlFor="parsedMakerTraits.shouldCheckEpoch">Should check epoch</label>
                        <Controller
                            name="parsedMakerTraits.shouldCheckEpoch"
                            control={parsedOrderForm.control}
                            render={({ field }) => (
                                <input type="checkbox"
                                       checked={field.value}
                                       readOnly
                                       id="parsedMakerTraits.shouldCheckEpoch" value="false"></input>
                            )}
                        />
                    </div>

                    <div className="field-container">
                        <label htmlFor="parsedMakerTraits.allowPartialFill">Allow partial fill</label>
                        <Controller
                            name="parsedMakerTraits.allowPartialFill"
                            control={parsedOrderForm.control}
                            render={({ field }) => (
                                <input type="checkbox"
                                       checked={field.value}
                                       readOnly
                                       id="parsedMakerTraits.allowPartialFill" value="false"></input>
                            )}
                        />
                    </div>

                    <div className="field-container">
                        <label htmlFor="parsedMakerTraits.allowPriceImprovement">Allow price improvement</label>
                        <Controller
                            name="parsedMakerTraits.allowPriceImprovement"
                            control={parsedOrderForm.control}
                            render={({ field }) => (
                                <input type="checkbox"
                                       checked={field.value}
                                       readOnly
                                       id="parsedMakerTraits.allowPriceImprovement" value="false"></input>
                            )}
                        />
                    </div>

                    <div className="field-container">
                        <label htmlFor="parsedMakerTraits.allowMultipleFills">Allow multiple fields</label>
                        <Controller
                            name="parsedMakerTraits.allowMultipleFills"
                            control={parsedOrderForm.control}
                            render={({ field }) => (
                                <input type="checkbox"
                                       checked={field.value}
                                       readOnly
                                       id="parsedMakerTraits.allowMultipleFills" value="false"></input>
                            )}
                        />
                    </div>

                    <div className="field-container">
                        <label htmlFor="parsedMakerTraits.usePermit2">Permit 2</label>
                        <Controller
                            name="parsedMakerTraits.usePermit2"
                            control={parsedOrderForm.control}
                            render={({ field }) => (
                                <input type="checkbox"
                                       checked={field.value}
                                       readOnly
                                       id="parsedMakerTraits.usePermit2" value="false"></input>
                            )}
                        />
                    </div>

                    <div className="field-container">
                        <label htmlFor="parsedMakerTraits.unwrapWeth">Unwrap WETH</label>
                        <Controller
                            name="parsedMakerTraits.unwrapWeth"
                            control={parsedOrderForm.control}
                            render={({ field }) => (
                                <input type="checkbox"
                                       checked={field.value}
                                       readOnly
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
                                <input id="parsedMakerTraits.expiry" {...field} readOnly></input>
                            )}
                        />
                    </div>

                    <div className="field-container">
                        <label htmlFor="parsedMakerTraits.nonce">Nonce</label>
                        <Controller
                            name="parsedMakerTraits.nonce"
                            control={parsedOrderForm.control}
                            render={({ field }) => (
                                <input id="parsedMakerTraits.nonce" {...field} readOnly></input>
                            )}
                        />
                    </div>

                    <div className="field-container">
                        <label htmlFor="parsedMakerTraits.series">Series</label>
                        <Controller
                            name="parsedMakerTraits.series"
                            control={parsedOrderForm.control}
                            render={({ field }) => (
                                <input id="parsedMakerTraits.series" {...field} readOnly></input>
                            )}
                        />
                    </div>
                </div>

                <div className="border p-1">
                    <h5>Extension:</h5>
                        <div className="field-container">
                          <label htmlFor="parsedExtension.permit"> Permit:</label>
                          <input type="text"
                                 {...parsedOrderForm.register('parsedExtension.permit')}
                                 id="makerTraits.permit"></input>
                        </div>

                        <div className="field-container">
                          <label htmlFor="parsedExtension.predicate"> predicate:</label>
                          <input type="text"
                                 {...parsedOrderForm.register('parsedExtension.predicate')}
                                 id="makerTraits.predicate"></input>
                        </div>

                        <div className="field-container">
                          <label htmlFor="parsedExtension.makerAssetSuffix"> makerAssetSuffix:</label>
                          <input type="text"
                                 {...parsedOrderForm.register('parsedExtension.makerAssetSuffix')}
                                 id="makerTraits.makerAssetSuffix"></input>
                        </div>

                        <div className="field-container">
                          <label htmlFor="parsedExtension.makerAssetSuffix"> takerAssetSuffix:</label>
                          <input type="text"
                                 {...parsedOrderForm.register('parsedExtension.takerAssetSuffix')}
                                 id="makerTraits.takerAssetSuffix"></input>
                        </div>

                        <div className="field-container">
                          <label htmlFor="parsedExtension.postInteraction"> postInteraction:</label>
                          <input type="text"
                                 {...parsedOrderForm.register('parsedExtension.postInteraction')}
                                 id="makerTraits.postInteraction"></input>
                        </div>

                        <div className="field-container">
                          <label htmlFor="parsedExtension.postInteraction"> preInteraction:</label>
                          <input type="text"
                                 {...parsedOrderForm.register('parsedExtension.preInteraction')}
                                 id="makerTraits.preInteraction"></input>
                        </div>

                        <div className="field-container">
                          <label htmlFor="parsedExtension.makingAmountGetter"> makingAmountGetter:</label>
                          <input type="text"
                                 {...parsedOrderForm.register('parsedExtension.makingAmountGetter')}
                                 id="makerTraits.makingAmountGetter"></input>
                        </div>

                        <div className="field-container">
                          <label htmlFor="parsedExtension.takingAmountGetter"> takingAmountGetter:</label>
                          <input type="text"
                                 {...parsedOrderForm.register('parsedExtension.takingAmountGetter')}
                                 id="makerTraits.takingAmountGetter"></input>
                        </div>

                        <div className="field-container">
                          <label htmlFor="parsedExtension.customData"> customData:</label>
                          <input type="text"
                                 {...parsedOrderForm.register('parsedExtension.customData')}
                                 id="makerTraits.customData"></input>
                        </div>
                </div>
            </div>
        </>
    );
}
