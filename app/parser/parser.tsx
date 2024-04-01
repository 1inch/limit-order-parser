import {Controller, FieldValues, useForm} from "react-hook-form";
import { LimitOrder, LimitOrderBuilder, LimitOrderDecoder, ZX } from "@1inch/limit-order-protocol-utils";
import {FormattedMakerTraits, getLimitOrderFacade} from "@/app/helpers/helpers";
import {omit} from "next/dist/shared/lib/router/utils/omit";
import React from "react";
import StringField from "@/app/components/string-field";
import InchButton from "@/app/components/inch-button";
import RenderIfWalletIsConnected from "@/app/components/render-if-wallet-is-connected";
import ConnectWalletBtn from "@/app/components/connect-wallet-btn";

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
            <form className="grid grid-cols-1 gap-1" onSubmit={orderForm.handleSubmit((data) => parseOrder(data))}>
              <div className="flex flex-col gap-10">
                <textarea className="bg-1inch-bg-1 p-4 rounded-2xl w-100%"
                          style={{height: '370px'}}
                          defaultValue={JSON.stringify(ethereumOrderMockWithPredicate)}
                          {...orderForm.register('order')}
                          placeholder="Put order structure here"
                ></textarea>
                <div className='flex justify-center flex-1'>
                  <RenderIfWalletIsConnected
                    ifConnected={<InchButton className='w-1/2'>Parse</InchButton>}
                    ifNotConnected={<InchButton className='w-1/2'>Parse</InchButton>}/>
                </div>
              </div>
            </form>

            <div className="grid grid-cols-1 gap-1 p-10">
                <StringField readOnly formInstance={parsedOrderForm} name='makerAsset' label='Maker asset'></StringField>
                <StringField readOnly formInstance={parsedOrderForm} name='takerAsset' label='TakerAsset'></StringField>
                <StringField readOnly formInstance={parsedOrderForm} name='orderHash' label='Order hash'></StringField>
                <div className="border rounded-2xl p-4 mt-4 grid grid-cols-1 gap-4">
                    <h5>Maker traits:</h5>

                  <StringField readOnly formInstance={parsedOrderForm}
                               name='parsedMakerTraits.allowedSender' label='Allowed sender'></StringField>

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

                  <StringField formInstance={parsedOrderForm}
                               readOnly
                               name='parsedMakerTraits.expiry' label='Expiry'></StringField>

                  <StringField formInstance={parsedOrderForm}
                               readOnly
                               name='parsedMakerTraits.nonce' label='Nonce'></StringField>

                  <StringField formInstance={parsedOrderForm}
                               readOnly
                               name='parsedMakerTraits.series' label='Series'></StringField>
                </div>

                <div className="rounded-2xl p-4 mt-4 border grid grid-cols-1 gap-4">
                    <h5>Extension:</h5>

                    <StringField formInstance={parsedOrderForm}
                                 readOnly
                                 name='parsedExtension.permit' label='Permit'></StringField>

                    <StringField formInstance={parsedOrderForm}
                                 readOnly
                                 name='parsedExtension.predicate' label='predicate'></StringField>

                    <StringField formInstance={parsedOrderForm}
                                 readOnly
                                 name='parsedExtension.makerAssetSuffix' label='makerAssetSuffix'></StringField>

                    <StringField formInstance={parsedOrderForm}
                                 readOnly
                                 name='parsedExtension.takerAssetSuffix' label='takerAssetSuffix'></StringField>

                    <StringField formInstance={parsedOrderForm}
                                 readOnly
                                 name='parsedExtension.takerAssetSuffix' label='takerAssetSuffix'></StringField>

                    <StringField formInstance={parsedOrderForm}
                                 readOnly
                                 name='parsedExtension.postInteraction' label='postInteraction'></StringField>

                    <StringField formInstance={parsedOrderForm}
                                 readOnly
                                 name='parsedExtension.preInteraction' label='preInteraction'></StringField>

                    <StringField formInstance={parsedOrderForm}
                                 readOnly
                                 name='parsedExtension.makingAmountGetter' label='makingAmountGetter'></StringField>

                    <StringField formInstance={parsedOrderForm}
                                 readOnly
                                 name='parsedExtension.takingAmountGetter' label='takingAmountGetter'></StringField>

                    <StringField formInstance={parsedOrderForm}
                                 readOnly
                                 name='parsedExtension.customData' label='customData'></StringField>
                </div>
            </div>
        </>
    );
}
