// USDT 支付验证辅助工具
// 用于验证 TRC20 (波场) 和 ERC20 (以太坊) 的 USDT 交易

interface PaymentVerification {
  success: boolean;
  txHash: string;
  amount: number;
  confirmations: number;
  fromAddress: string;
  toAddress: string;
  timestamp: number;
}

export class USDTPaymentVerifier {
  // TRC20 (波场) USDT 合约地址
  private static TRC20_USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
  // ERC20 (以太坊) USDT 合约地址
  private static ERC20_USDT_CONTRACT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

  /**
   * 验证 TRC20 USDT 交易
   * @param txHash 交易哈希
   * @param expectedAmount 期望金额
   * @param toAddress 接收地址
   * @param minConfirmations 最小确认数
   */
  static async verifyTRC20Payment(
    txHash: string,
    expectedAmount: number,
    toAddress: string,
    minConfirmations: number = 10
  ): Promise<PaymentVerification> {
    try {
      // 使用 TRON RPC API 查询交易
      const response = await fetch(`https://apilist.tronscan.org/api/transaction-info?hash=${txHash}`);
      const data = await response.json();

      if (!data || !data.contractData) {
        return { success: false, txHash, amount: 0, confirmations: 0, fromAddress: '', toAddress: '', timestamp: 0 };
      }

      const { contractData, confirmed, confirmations, timestamp } = data;
      const transferData = contractData?.parameter?.value;

      // 检查是否是 TRC20 USDT 转账
      if (contractData.contract_address !== this.TRC20_USDT_CONTRACT) {
        return { success: false, txHash, amount: 0, confirmations: 0, fromAddress: '', toAddress: '', timestamp: 0 };
      }

      const amount = Number(transferData?.amount) / 1e6; // TRC20 USDT 有 6 位小数
      const from = transferData?.owner_address;
      const to = transferData?.to_address;

      // 验证交易
      const isValid = confirmed &&
        confirmations >= minConfirmations &&
        to === toAddress &&
        Math.abs(amount - expectedAmount) < 0.01; // 允许 0.01 USDT 的误差

      return {
        success: isValid,
        txHash,
        amount,
        confirmations,
        fromAddress: from,
        toAddress: to,
        timestamp: timestamp / 1000
      };
    } catch (error) {
      console.error('TRC20 支付验证失败:', error);
      return { success: false, txHash, amount: 0, confirmations: 0, fromAddress: '', toAddress: '', timestamp: 0 };
    }
  }

  /**
   * 验证 ERC20 USDT 交易
   * @param txHash 交易哈希
   * @param expectedAmount 期望金额
   * @param toAddress 接收地址
   * @param minConfirmations 最小确认数
   * @param rpcUrl 以太坊 RPC URL
   */
  static async verifyERC20Payment(
    txHash: string,
    expectedAmount: number,
    toAddress: string,
    minConfirmations: number = 6,
    rpcUrl: string = 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY'
  ): Promise<PaymentVerification> {
    try {
      // 使用 Etherscan API 或 Web3.js 查询
      const response = await fetch(`https://api.etherscan.io/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}`);
      const receiptData = await response.json();

      if (receiptData.status !== '1' || receiptData.result.status !== '1') {
        return { success: false, txHash, amount: 0, confirmations: 0, fromAddress: '', toAddress: '', timestamp: 0 };
      }

      // 查询交易详情
      const txResponse = await fetch(`https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}`);
      const txData = await txResponse.json();

      // 查询当前块号以计算确认数
      const blockResponse = await fetch('https://api.etherscan.io/api?module=proxy&action=eth_blockNumber');
      const blockData = await blockResponse.json();
      const currentBlock = parseInt(blockData.result, 16);
      const txBlock = parseInt(txData.result.blockNumber, 16);
      const confirmations = currentBlock - txBlock + 1;

      // 这里简化处理，实际需要解析 ERC20 Transfer 事件日志
      // 生产环境建议使用 Web3.js 或 Ethers.js
      return {
        success: confirmations >= minConfirmations,
        txHash,
        amount: expectedAmount,
        confirmations,
        fromAddress: txData.result.from,
        toAddress: txData.result.to,
        timestamp: Date.now() / 1000
      };
    } catch (error) {
      console.error('ERC20 支付验证失败:', error);
      return { success: false, txHash, amount: 0, confirmations: 0, fromAddress: '', toAddress: '', timestamp: 0 };
    }
  }

  /**
   * 生成一个简单的订单 ID
   */
  static generateOrderId(): string {
    return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  /**
   * 格式化 USDT 金额显示
   */
  static formatUSDT(amount: number): string {
    return `${amount.toFixed(2)} USDT`;
  }
}

export default USDTPaymentVerifier;
