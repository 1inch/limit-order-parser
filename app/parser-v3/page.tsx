'use client'

import RenderIfWalletIsConnected from "@/app/components/render-if-wallet-is-connected";
import InchButton from "@/app/components/inch-button";
import React from "react";
import { FieldValues, useForm } from "react-hook-form";
import { LimitOrderLegacy } from "@1inch/limit-order-protocol-utils";
import { getLimitOrderFacadeV3 } from "@/app/helpers/helpers";
import { recoverAddress } from "ethers";
import StringField from "@/app/components/string-field";

const orderMock = {
  allowedSender: '0xa88800cd213da5ae406ce248380802bd53b47647',
  interactions: '0xbfa75143000000000000000000000000000000000000000000000000000000a800000024000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a863592c2b0000000000000000000000000000000000000000000000000000000065f82eb3bf15fcd80000000000000000000000005e92d4021e49f9a2967b4ea1d20213b3a1c7c912000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000040202470800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b8a49d816cc709b6eadb09498030ae3416b66dc00000000874d26f8f5dd55ee1a4167c49965b991c1c9530a00000000d1742b3c4fbb096990c8950fa635aec75b30781a00000000ad3b67bca8935cb510c8d18bd45f0b94f54a968f000000008571c129f335832f6bbc76d49414ad2b8371a42200000000f14f17989790a2116fc0a59ca88d5813e693528f00000000d14699b6b02e900a5c2338700d5181a674fdb9a2ffffffff38',
  maker: '0x6edfb29e8bc75cbf448f2c557153dbcd979123b2',
  makerAsset: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  makingAmount: '2000000000',
  offsets: '0x12400000124000001240000012400000000000000000000000000000000',
  receiver: '0x0000000000000000000000000000000000000000',
  salt: '46122092693148306155654862778940756091791315691212717845485035582808298072652',
  takerAsset: '0x111111111117dc0aa78b770fa6a738034120c302',
  takingAmount: '3336299920270844680073'
}

const signature = '0x7badb3296e2bb4b3dccb874fdb153cc80572d146d7b770570a22585bbbc643a45a401c215528f00c6a505dfc489b3ea55f6efb3ab9bff66436e26b4970b52c4e1b';

export default function Page() {
  const orderForm = useForm<{ order: string, signature: string }>({
    defaultValues: {
      order: JSON.stringify(orderMock, null, 2),
      signature: signature
    }
  });

  const parseOrder = async (data: FieldValues) => {
    let order: LimitOrderLegacy & { signature: string } | null = null;
    try {
      order = JSON.parse(data.order);
    } catch (e) {
      alert(`Can't parse order`);
    }

    if (!order) {
      return;
    }
    const facade = await getLimitOrderFacadeV3();
    const orderHash = await facade.callHashOrder(order);
    const checkSignature = recoverAddress(orderHash, signature);

    alert(`signature is valid: ${checkSignature === order.maker}`);
  }

  return (
    <>
      <form className="grid grid-cols-1 gap-1" onSubmit={orderForm.handleSubmit((data) => parseOrder(data))}>
        <div className="flex flex-col gap-10">
                <textarea className="bg-1inch-bg-1 p-4 rounded-2xl w-100%"
                          style={{height: '370px'}}
                          {...orderForm.register('order')}
                          placeholder="Put order structure here"
                ></textarea>

          <StringField formInstance={orderForm}
                       name='signature' label='Signature'></StringField>
          <div className='flex justify-center flex-1'>
            <RenderIfWalletIsConnected
              ifConnected={<InchButton className='w-1/2'>Validate signature</InchButton>}
              ifNotConnected={<InchButton className='w-1/2'>Validate signature</InchButton>}/>
          </div>
        </div>
      </form>
    </>
  )
}
