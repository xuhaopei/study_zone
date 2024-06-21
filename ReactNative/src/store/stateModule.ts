import {createSlice} from '@reduxjs/toolkit';

import {UserInfo, BalanceInfos} from 'src/types/index';

export interface State {
  loading: boolean;
  isShowLogin: boolean;
  useInfo: UserInfo;
  balanceInfos: BalanceInfos;
}
// 定义stateModule下初始化的state
const state = {
  loading: false,
  useInfo: null,
  isShowLogin: false,
  balanceInfos: null,
};

// 初始化store树中stateModule的初始数据state与修改state的方法reducers
export const stateModule = createSlice({
  name: 'state',
  initialState: state,
  reducers: {
    setUseInfo(state, action) {
      state.useInfo = action.payload;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setIsShowLogin(state, action) {
      state.isShowLogin = action.payload;
    },
    setBalanceInfos(state, action) {
      state.balanceInfos = action.payload;
    },
  },
});

// 导出同步方法，方便react组件使用
export const {setUseInfo, setLoading, setIsShowLogin, setBalanceInfos} = stateModule.actions;

// 导出异步方法
export const asyncActionSetUserInfo = (params = {}) => {
  return async (dispatch: any, getState: any) => {
    dispatch(setLoading(true));
    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(1);
        }, 3000);
      });
      dispatch(asyncActionSetUserInfo(params));
    } catch (error) {
      console.error(error);
    }
    dispatch(setLoading(false));
  };
};
