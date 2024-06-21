import { get, post } from 'src/utils/axios'
export default class Apis {
  
  // @errorMessageDecorator
  static v1WalletBalance = get('/api/v1/wallet/balance')

  // @errorMessageDecorator
  static v1WalletExchange = post('/api/v1/wallet/exchange')

  // @errorMessageDecorator
  static walletExchangeList = get('/api/v1/wallet/exchange/list')

  // contribute
  static getContributeRank = get('/api/v1/flow/income/rank')

  static payinOrderCreate = post('/api/v1/pay/payin/order/create')


  static getPayInfo = get('/api/v1/pay/guide/info/get')
  
  static payProDuctList = get('/api/v1/pay/product/list')

  // send gift
  // // @errorMessageDecorator
  static sendGift = post('/api/v1/gift/send')


  static v2WalletBalance = get('/api/v2/wallet/balance')


  static v2Productlist = get('/api/v2/pay/product/list')


  static infoWithdraw = get('/api/v1/user/info/withdraw')


  static payoutConf = get('/api/v1/pay/payout/conf')
  
  static createOrder = post('/api/v1/pay/payout/order/create')


  static productListByMethod = get('/api/v1/pay/product/list_by_method')

  
}
