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
