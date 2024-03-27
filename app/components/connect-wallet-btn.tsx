import { useProvider } from "@/app/providers/providers-context";

export default function ConnectWalletBtn() {
  const { setActiveProvider } = useProvider();

  return (
    <button className='bg-1inch-bg-3 rounded-2xl p-4 text-1inch-text-2 flex hover:bg-btn-active-color-2'>
      <img src='https://app.1inch.io/assets/images/icons/connect.svg' alt='Connect wallet' className='mr-2'/>
      <span>Connect wallet</span>
    </button>
  )
}

