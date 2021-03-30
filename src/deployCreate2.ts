import { TransactionReceipt } from '@ethersproject/providers'
import { ContractFactory, Signer } from 'ethers'
import { deployContract } from './'

type CFClass = (new (signer: Signer) => ContractFactory) & {
  connect: (address: string, signer: Signer) => unknown
}

// https://stackoverflow.com/questions/63789897/typescript-remove-last-element-from-parameters-tuple-currying-away-last-argum
type Head<T extends any[]> = Required<T> extends [...infer H, any] ? H : never

/**
 * Deploys a smart contract via CREATE2.
 * @returns Deployment info
 */
export const deployCreate2 = async <C extends CFClass>({
  salt,
  signer,
  factory,
  args,
}: {
  salt: string
  signer: Signer
  factory: C
  args: C extends new (signer: Signer) => {
    deploy: (...args: infer A) => Promise<unknown>
  }
    ? Head<A>
    : never
}): Promise<{
  txHash: string
  address: string
  receipt: TransactionReceipt
  contract: C extends {
    connect: (address: string, signer: Signer) => infer Inst
  }
    ? Inst
    : never
}> => {
  type ContractInstance = C extends {
    connect: (address: string, signer: Signer) => infer Inst
  }
    ? Inst
    : never
  const cf = new factory(signer)
  const result = await deployContract({
    salt,
    contractBytecode: cf.bytecode,
    signer,
    constructorTypes: cf.interface.deploy.inputs.map((input) => input.type),
    constructorArgs: args,
  })
  return {
    ...result,
    contract: factory.connect(result.address, signer) as ContractInstance,
  }
}
