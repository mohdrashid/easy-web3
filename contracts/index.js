module.exports = class Contract {

    /**
     * Constructor
     * @param {*} web3 : An instance of web3
     * @param {*} abi : ABI of the contract
     * @param {*} code : Byte code of the contract
     * @param {*} isQuorum : Check if it ethereum mainpnet or quorum implementation
     */
    constructor(web3, abi, code, isQuorum) {
        this.web3 = web3;
        this.instance = new this.web3.eth.Contract(abi);
        this.code = isQuorum ? ('0x' + code) : code;
        this.receipt = undefined;
        this.transactionHash = undefined;
    }

    /**
     * Returns the bytecode
     */
    getCode() {
        return this.code;
    }

    /**
     * Retutns the instance
     */
    getInstance() {
        return this.instance;
    }

    /**
     * Returns deployment transaction receipt
     */
    getReceipt() {
        return this.receipt;
    }

    /**
     * Returns the transaction hash during the deployment of contract
     */
    getTransactionHash() {
        return this.transactionHash;
    }

    /**
     * Deploys a contract from the instance
     * @param {*} args : Any arguments to pass to the constructor
     * @param {*} from : The initiator of contract
     * @param {*} value : Ether to send along if the constructor is payable
     * @param {*} options : Any other options related to gas or gasPrice
     */
    deployContract(args, from, value, options) {
        let sendParmas = {
            from: from
        }

        for (let key in options) {
            sendParmas[key] = options[key];
        }

        if (value !== undefined && value > 0) {
            sendParmas['value'] = value;
        }
        return new Promise((resolve, reject) => {
            this.instance.deploy({
                data: this.code,
                arguments: args
            }).send(sendParmas, (error, transactionHash) => {
                if (error) {
                    reject(error)
                }
                this.transactionHash = transactionHash;
            })
                .on('error', (error) => reject)
                .on('confirmation', (confirmationNumber, receipt) => {
                    this.receipt = receipt;
                    this.instance.options.address = receipt.contractAddress;
                    resolve(this.instance);
                });
        });
    }

    /**
     * A setter function to set address of an already deployed contract
     * @param {*} address : Address of the deployed contract
     */
    setAddress(address) {
        this.instance.options.address = address;
    }

    /**
     * A setter function to be used if the contract ABI is available
     * @param {*} abi : ABI of the contract
     */
    setAbi(abi) {
        this.instance = new this.web3.eth.Contract(abi);
    }

    /**
     * A getter interface for contract functions/public variables
     * @param {*} functionName : The name of the function or variable name
     * @param {*} args : Arguments to pass to function if any
     * @param {*} from : Caller address
     * @param {*} value : Ether to send if the function is payable
     */
    get(functionName, args, from) {
        let sendParmas = {
            from: from
        }
        return this.instance.methods[functionName].apply(null, args).call(sendParmas);
    }

    /**
     * A setter interface for contract functions
     * @param {*} functionName : The name of the function
     * @param {*} args : Arguments to pass to function if any
     * @param {*} from : Caller address
     * @param {*} value : Ether to send if the function is payable
     */
    set(functionName, args, from, value, options) {
        let sendParmas = {
            from: from
        }

        for (let key in options) {
            sendParmas[key] = options[key];
        }

        if (value !== undefined && value > 0) {
            sendParmas['value'] = value;
        }

        return new Promise((resolve, reject) => {
            this.instance.methods[functionName].apply(null, args).send(sendParmas, (error, transactionHash) => {
                if (error) {
                    reject(error)
                }
            })
                .on('confirmation', (confirmationNumber, receipt) => {
                    resolve(receipt);
                })
                .on('error', reject)
        })
    }

    /**
    * Returns encoded value
    * @param {*} functionName : The name of the function
    * @param {*} args : Arguments to pass to function if any
    */
    getEncoded(functionName, args) {
        return this.instance.methods[functionName].apply(null, args).encodeABI();
    }
}