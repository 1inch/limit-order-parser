'use client'

import RenderIfWalletIsConnected from "@/app/components/render-if-wallet-is-connected";
import InchButton from "@/app/components/inch-button";
import React from "react";
import { FieldValues, useForm } from "react-hook-form";
import { LimitOrderLegacy } from "@1inch/limit-order-protocol-utils";
import { getLimitOrderBuilderV3 } from "@/app/helpers/helpers";
import { verifyTypedData } from "ethers/lib/utils";

const orderMock = {
  allowedSender: '0xa88800cd213da5ae406ce248380802bd53b47647',
  interactions: '0xbfa75143000000000000000000000000000000000000000000000000000000a800000024000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a863592c2b0000000000000000000000000000000000000000000000000000000065f8165ebf15fcd80000000000000000000000005e92d4021e49f9a2967b4ea1d20213b3a1c7c91200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000004020247080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008b067ad41e45babe5bbb52fc2fe7f692f628b06000000000b8a49d816cc709b6eadb09498030ae3416b66dc00000000874d26f8f5dd55ee1a4167c49965b991c1c9530a00000000d1742b3c4fbb096990c8950fa635aec75b30781a00000000ad3b67bca8935cb510c8d18bd45f0b94f54a968f000000008571c129f335832f6bbc76d49414ad2b8371a42200000000f14f17989790a2116fc0a59ca88d5813e693528f00000000d14699b6b02e900a5c2338700d5181a674fdb9a2ffffffff38',
  maker: '0xd50d59fe5024ece3bae5316119f2ae9fe7060d25',
  makerAsset: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
  makingAmount: '25360008955180403',
  offsets: '0x13800000124000001240000012400000000000000000000000000000000',
  receiver: '0x08b067ad41e45babe5bbb52fc2fe7f692f628b06',
  salt: '46121925110119823155026771269220733953948736922356467278677950290872657148726',
  takerAsset: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  takingAmount: '19907224740332444'
}

const signature = '0x32e8d898c1024401c83f12a1e5cd691dc427a36cd25b1c6c3a9d3e26dc7a16113a63a31005c000bb29dc14b2bd85b84c9e65c5286fd1248094eb6badbb02977d1b';

export default function Page() {
  const orderForm = useForm<{ order: string, signature?: string }>();

  const parseOrder = (data: FieldValues) => {
    let order: LimitOrderLegacy & { signature?: string } | null = null;
    try {
      order = JSON.parse(data.order);
    } catch (e) {
      alert(`Can't parse order`);
    }

    if (!order) {
      return;
    }

    const builder = getLimitOrderBuilderV3();
    const typedData = builder.buildLimitOrderTypedData(
      order,
      1,
      '0x1111111254EEB25477B68fb85Ed929f73A960582'
    );

    delete (typedData.types as any)['EIP712Domain']
    const result = verifyTypedData(typedData.domain, typedData.types, typedData.message, signature);
    console.log('signature is correct ', result)
  }

  return (
    <>
      <form className="grid grid-cols-1 gap-1" onSubmit={orderForm.handleSubmit((data) => parseOrder(data))}>
        <div className="flex flex-col gap-10">
                <textarea className="bg-1inch-bg-1 p-4 rounded-2xl w-100%"
                          style={{height: '370px'}}
                          defaultValue={JSON.stringify(orderMock)}
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
    </>
  )
}
