import React, { useState } from 'react';
import { Realm, RealmProvider, useRealm, useQuery } from '@realm/react';
const UserInfoSchema = {
  name: 'UserInfo',
  primaryKey: 'id',    // 官方没给出自增长的办法,而且一般不会用到主键,这也解决了重复访问的问题,而且实际开发中我们不需要主键的,让服务端管就是了
  properties: {
    id: 'int',
    data: 'string'
  }
};
// 根据提供的表初始化 Realm，可同时往数组中放入多个表
export let userInfoRealm = new Realm({schema: [UserInfoSchema]});