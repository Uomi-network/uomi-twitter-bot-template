const { Web3 } = require("web3")
const { ApiPromise, WsProvider } = require("@polkadot/api")
const config = require('../config')
const abi = require("../abi.json")

class UomiService {
  constructor() {
    this.web3 = new Web3(config.chain.rpc)
    this.contract = new this.web3.eth.Contract(abi, config.chain.address)
    this.account = this.web3.eth.accounts.privateKeyToAccount(config.chain.pk)

    this.memory = {}
  }

  async init() {
    const provider = new WsProvider(config.chain.wsRpc)
    const api = await ApiPromise.create({ provider: provider })

    api.query.system.events(async (events) => {
      const blockHash = await api.rpc.chain.getBlockHash()
      const blockHashHex = blockHash.toHex()
      const block = await api.rpc.chain.getBlock(blockHash)
      
      events.forEach(async (record) => {
        const { event, phase } = record
        const types = event.typeDef
        const eventName = `${event.section}.${event.method}`
        if (!eventName.startsWith("uomiEngine.")) return

        const eventData = event.data.map((data, index) => ({ type: types[index].type, data: data.toString() }))

        if (eventName === "uomiEngine.RequestAccepted") {
          const requestId = parseInt(eventData[0].data);
          const address = parseInt(eventData[1].data);
          const nftId = parseInt(eventData[2].data);
          this.memory[requestId] = {
            time: new Date().getTime(),
            requestId,
            address,
            nftId,
            executions: [],
          }
          console.log("🔔 uomiEngine.RequestAccepted", requestId)
        }

        if (eventName === "uomiEngine.NodeOutputReceived") {
          const requestId = parseInt(eventData[0].data)
          const accountId = eventData[1].data
          const output = eventData[2].data
          if (!this.memory[requestId]) return
  
          let hexEncodedCall = null
          if (phase.isApplyExtrinsic) {
            const extrinsicIndex = phase.asApplyExtrinsic
            const extrinsic = block.block.extrinsics[extrinsicIndex]
            if (!extrinsic) return
            hexEncodedCall = extrinsic.toHex()
          }
  
          this.memory[requestId].executions.push({
            time: new Date().getTime(),
            output: output,
            accountId: accountId,
            blockHash: blockHashHex,
            hexEncodedCall: hexEncodedCall,
          })
          console.log("🔔 uomiEngine.NodeOutputReceived", requestId)
        }
  
        if (eventName === "uomiEngine.RequestCompleted") {
          const requestId = parseInt(eventData[0].data)
          const output = eventData[1].data
          const totalExecutions = parseInt(eventData[2].data)
          const totalConsensus = parseInt(eventData[3].data)
          if (!this.memory[requestId]) return
  
          this.memory[requestId].output = output
          this.memory[requestId].totalExecutions = totalExecutions
          this.memory[requestId].totalConsensus = totalConsensus
          this.memory[requestId].completed = true
          console.log("🔔 uomiEngine.RequestCompleted", requestId)
        }
      })
    })
  }

  async callAgent(inputData) {
    const data = this.contract.methods.callAgent(config.chain.agent_nft_id, "", inputData).encodeABI()
    const tx = {
      from: this.account.address,
      to: config.chain.address,
      data: data,
      gas: 10000000,
      gasPrice: 36540000001,
    }

    const signedTx = await this.account.signTransaction(tx)
    const response = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    return response
  }

  getRequest(requestId) {
    return this.memory[requestId]
  }

  getLastRequest() {
    this.clearMemory()

    const requests = Object.values(this.memory)
    const requestsFiltered = requests.filter(request => request.nftId === config.chain.agent_nft_id) // TODO: Aggiungere filtro per address
    const requestsSorted = requestsFiltered.sort((a, b) => b.time - a.time)

    return requestsSorted[0]
  }

  clearMemory() { // remove from memory all completed requests older than 30 minutes
    const now = new Date().getTime()
    const requests = Object.values(this.memory)
    const requestsFiltered = requests.filter(request => request.completed && now - request.time > 30 * 60 * 1000)
    requestsFiltered.forEach(request => delete this.memory[request.requestId])
  }
}

module.exports = new UomiService()