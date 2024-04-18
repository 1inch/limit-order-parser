import {Controller, FieldValues, useForm} from "react-hook-form";
import { LimitOrder, LimitOrderBuilder, LimitOrderDecoder, ZX } from "@1inch/limit-order-protocol-utils";
import { areAddressesEqual, FormattedMakerTraits, getLimitOrderFacade } from "@/app/helpers/helpers";
import {omit} from "next/dist/shared/lib/router/utils/omit";
import React from "react";
import StringField from "@/app/components/string-field";
import InchButton from "@/app/components/inch-button";
import RenderIfWalletIsConnected from "@/app/components/render-if-wallet-is-connected";
import { recoverAddress } from "ethers";

const ethereumOrderMockWithPredicate = {
  "maker": "0xcd4060fa7b5164281f150fa290181401524ef76f",
  "makerAsset": "0x9c9e5fd8bbc25984b178fdce6117defa39d2db39",
  "takerAsset": "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
  "makerTraits": "62419173104490761595518734106523177391962351931958729461099035058323207487488",
  "salt": "102412815598624645945776585183142866624520148660939114470387183071274861343509",
  "makingAmount": "561047938392911058",
  "takingAmount": "716209452151640480",
  "receiver": "0x0000000000000000000000000000000000000000"
}

const SIGNATURE ='0xbb90b0539373f6605b20c656250fc57a8ee6be5f50a5f01139d40b8518537d8d5e0a97950c05bd965aabda486aebd1dc7a831e9659e89086a44db3fb83d7b4f51b'

type CreateExtensionParams = NonNullable<Parameters<LimitOrderBuilder['buildLimitOrder']>[1]>;
type ExtensionParams = Required<CreateExtensionParams>;

type ParsedOrder = Pick<LimitOrder, 'makerAsset' | 'takerAsset' | 'makingAmount' | 'takingAmount'> & {
  isSignatureValid: boolean;
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
  const orderForm = useForm<{ order: string, signature?: string }>({
    defaultValues: {
      order: JSON.stringify(ethereumOrderMockWithPredicate),
      signature: SIGNATURE,
    }
  });
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

    const parsedExtension = order.extension !== undefined && order.extension !== ZX
      ? LimitOrderDecoder.unpackExtension(order.extension)
      : { customData: ZX, interactions: {...defaultExtension} };

    const extensionData: ExtensionParams =  {
      ...defaultExtension,
      ...parsedExtension.interactions,
      customData: parsedExtension.customData,
    };

    const checkSignature = data.signature ? recoverAddress(orderHash, data.signature) : null;

    const { reset } = parsedOrderForm;
    reset({
      ...order,
      isSignatureValid: checkSignature === null ? false : areAddressesEqual(checkSignature, order.maker),
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
                <textarea className="bg-1inch-bg-1 p-4 rounded-2xl w-100% outline-0"
                          style={{height: '370px'}}
                          {...orderForm.register('order')}
                          placeholder="Put order structure here"
                ></textarea>

                <StringField formInstance={orderForm}
                             name='signature' label='Signature'></StringField>
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

                <div className="field-container">
                  <label htmlFor="isSignatureValid">Is signature valid</label>
                  <Controller
                    name="isSignatureValid"
                    control={parsedOrderForm.control}
                    render={({ field }) => (
                      <input type="checkbox"
                             checked={field.value}
                             readOnly
                             id="isSignatureValid" value="false"></input>
                    )}
                  />
                </div>

                <div className="rounded-2xl p-4 mt-4 grid grid-cols-1 gap-4">
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

                <div className="rounded-2xl p-4 mt-4 grid grid-cols-1 gap-4">
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
