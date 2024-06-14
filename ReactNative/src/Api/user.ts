import {get, post} from './index.ts';

export default class Apis {
  // @errorMessageDecorator
  static accountSmsSend = post('/api/v1/user/account/sms/send');

  // @errorMessageDecorator
  static accountSmsVerify = post('/api/v1/user/account/sms/verify');

  // @errorMessageDecorator
  static userAccountLogin = post('/api/v1/user/account/login');

  static imTokenReset = post('/api/v1/user/im/token/reset');

  // @errorMessageDecorator
  static accountInfoSelf = get('/api/v1/user/account/info/self');

  // @errorMessageDecorator
  static accountInfoEdit = post('/api/v1/user/account/info/edit');

  // @errorMessageDecorator
  static accountInfoOther = get('/api/v1/user/account/info/other');

  // @errorMessageDecorator
  static userAuthSubmit = post('/api/v1/user/auth/submit');

  // @errorMessageDecorator
  static balanceWithdrawalInfoEdit = post(
    '/api/v1/user/balance_withdrawal/info/edit',
  );

  // @errorMessageDecorator
  static userBalanceWithdrawalInfo = get(
    '/api/v1/user/balance_withdrawal/info',
  );

  // @errorMessageDecorator
  static userBlacklistAdd = post('/api/v1/user/blacklist/add');

  // @errorMessageDecorator
  static userBlacklistRemove = post('/api/v1/user/blacklist/remove');

  // @errorMessageDecorator
  static v1UserBlacklist = get('/api/v1/user/blacklist');

  // @errorMessageDecorator
  static userReportSubmit = post('/api/v1/user/report/submit');

  // @errorMessageDecorator
  static userRelationFollow = post('/api/v1/user/relation/follow');

  // @errorMessageDecorator
  static userRelationUnfollow = post('/api/v1/user/relation/unfollow');

  // @errorMessageDecorator
  static userRelationFollowers = get('/api/v1/user/relation/followers');

  // @errorMessageDecorator
  static userRelationFans = get('/api/v1/user/relation/fans');

  // @errorMessageDecorator
  static accountThirdPartyLogin = post(
    '/api/v1/user/account/third_party/login',
  );

  // @errorMessageDecorator
  static accountLogout = post('/api/v1/user/account/logout');

  // @errorMessageDecorator
  static regionList = get('/api/v1/user/region/list');

  // @errorMessageDecorator
  static accountThirdPartyBind = post('/api/v1/user/account/third_party/bind');

  static accountLogin = post('/api/v1/user/account/login');
}
