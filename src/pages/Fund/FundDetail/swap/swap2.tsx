import './swap.css';
import { useState, useEffect } from 'react';
import { ethers, BigNumber } from 'ethers';
import { GearFill } from 'react-bootstrap-icons';

import PageButton from './PageButton';
import ConnectButton from './ConnectButton';
import ConfigModal from './ConfigModal';
import CurrencyField from './CurrencyField';

import BeatLoader from "react-spinners/BeatLoader";

import { AlphaRouter } from '@uniswap/smart-order-router'
import { Token, CurrencyAmount, TradeType, Percent } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import ERC20ABI from 'abis/erc20.json'
import { useTokenContract } from 'hooks/useContract'
import { useWeb3React } from '@web3-react/core'
import { formatEther, parseEther } from '@ethersproject/units'

export default function FundSwap() {

  const V3_SWAP_ROUTER_ADDRESS = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'

  const [slippageAmount, setSlippageAmount] = useState(2)
  const [deadlineMinutes, setDeadlineMinutes] = useState(10)
  const [showModal, setShowModal] = useState(undefined)

  const [inputAmount, setInputAmount] = useState(undefined)
  const [outputAmount, setOutputAmount] = useState(undefined)
  const [transaction, setTransaction] = useState(undefined)
  const [loading, setLoading] = useState(undefined)
  const [ratio, setRatio] = useState(undefined)

    

  const { account, chainId, provider } = useWeb3React()

  const name0 = 'Wrapped Ether'
  const symbol0 = 'WETH'
  const decimals0 = 18
  const address0 = '0xc778417e063141139fce010982780140aa0cd5ab'
  
  const name1 = 'Uniswap Token'
  const symbol1 = 'UNI'
  const decimals1 = 18
  const address1 = '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'


  const wethContract = useTokenContract(address0)
  const uniContract = useTokenContract(address1)


//   const getSigner = async provider => {
//     provider.send("eth_requestAccounts", []);
//     const signer = provider.getSigner();
//     setSigner(signer)
//   }
  const isConnected = () => account !== undefined


  const getSwapPrice = (inputAmount) => {
    setLoading(true)
    setInputAmount(inputAmount)

    const swap = getPrice(
      inputAmount,
      slippageAmount,
      Math.floor(Date.now()/1000 + (deadlineMinutes * 60)),
      account
    ).then(data => {
      if(!data || data[0]) {
        console.log("data is null")
        return
      }
      setTransaction(data[0])
      setOutputAmount(data[1])
      setRatio(data[2])
      setLoading(false)
    })
  }


  const getPrice = async (inputAmount, slippageAmount, deadline, account) => {
    if (!chainId || provider) return
    const router = new AlphaRouter({ chainId: chainId, provider: provider })

    const WETH = new Token(chainId, address0, decimals0, symbol0, name0)
    const UNI = new Token(chainId, address1, decimals1, symbol1, name1)
  
    const percentSlippage = new Percent(slippageAmount, 100)
    const wei = ethers.utils.parseUnits(inputAmount.toString(), decimals0)
    const currencyAmount = CurrencyAmount.fromRawAmount(WETH, JSBI.BigInt(wei))
  
    const route = await router.route(
      currencyAmount,
      UNI,
      TradeType.EXACT_INPUT,
      {
        recipient: account,
        slippageTolerance: percentSlippage,
        deadline: deadline,
      }
    )

    if (!route || !route.methodParameters) return
  
    const transaction = {
      data: route.methodParameters.calldata,
      to: V3_SWAP_ROUTER_ADDRESS,
      value: BigNumber.from(route.methodParameters.value),
      from: account,
      gasPrice: BigNumber.from(route.gasPriceWei),
      gasLimit: ethers.utils.hexlify(1000000)
    }
  
    const quoteAmountOut = route.quote.toFixed(6)
    const ratio = (inputAmount / quoteAmountOut).toFixed(3)
  
    return [
      transaction,
      quoteAmountOut,
      ratio
    ]
  }

  const runSwap = async (transaction, signer) => {
    const approvalAmount = ethers.utils.parseUnits('10', 18).toString()
    const contract0 = wethContract
    if (!contract0) return
    await contract0.connect(signer).approve(
      V3_SWAP_ROUTER_ADDRESS,
      approvalAmount
    )
  
    signer.sendTransaction(transaction)
  }

  return (
    <div className="App">
      <div className="appNav">
        <div className="my-2 buttonContainer buttonContainerTop">
          <PageButton name={"Swap"} isBold={true} />
          <PageButton name={"Pool"} />
          <PageButton name={"Vote"} />
          <PageButton name={"Charts"} />
        </div>

        <div className="rightNav">
          <div className="connectButtonContainer">
            <ConnectButton
              provider={provider}
              isConnected={isConnected}
              signerAddress={signerAddress}
              getSigner={getSigner}
            />
          </div>
          <div className="my-2 buttonContainer">
            <PageButton name={"..."} isBold={true} />
          </div>
        </div>
      </div>

      <div className="appBody">
        <div className="swapContainer">
          <div className="swapHeader">
            <span className="swapText">Swap</span>
            <span className="gearContainer" onClick={() => setShowModal(true)}>
              <GearFill />
            </span>
            {showModal && (
              <ConfigModal
                onClose={() => setShowModal(false)}
                setDeadlineMinutes={setDeadlineMinutes}
                deadlineMinutes={deadlineMinutes}
                setSlippageAmount={setSlippageAmount}
                slippageAmount={slippageAmount} />
            )}
          </div>

          <div className="swapBody">
            <CurrencyField
              field="input"
              tokenName="WETH"
              getSwapPrice={0}
              signer={signer}
              balance={wethAmount} />
            <CurrencyField
              field="output"
              tokenName="UNI"
              value={outputAmount}
              signer={signer}
              balance={uniAmount}
              spinner={BeatLoader}
              loading={loading} />
          </div>

          <div className="ratioContainer">
            {ratio && (
              <>
                {`1 UNI = ${ratio} WETH`}
              </>
            )}
          </div>

          <div className="swapButtonContainer">
            {isConnected() ? (
              <div
                onClick={() => runSwap(transaction, signer)}
                className="swapButton"
              >
                Swap
              </div>
            ) : (
              <div
                onClick={() => getSigner(provider)}
                className="swapButton"
              >
                Connect Wallet
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}