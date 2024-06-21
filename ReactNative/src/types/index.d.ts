export interface UserInfo {
  [keyName: string]: any;
  uid: string;
  account_type: number;
  avatar: string;
  nickname: string;
  level_info: {
    [keyName: string]: any;
    icon: string;
  };
  invite_info: {
    can_invite: boolean;
    invite_url: string;
    invite_code: string;
  };
}

export type BalanceInfos = Array<{
  balance_total: string; // 余额总计
  balance_drawable: string; // 可提现余额
  flag: string; // 国旗
  currency: string; // 币种
  balance_draw_money: number; // 可提现余额
}>;