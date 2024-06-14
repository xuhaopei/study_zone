import {configureStore} from '@reduxjs/toolkit';
import {stateModule} from './stateModule.ts';
// 创建并导出store树，方便react根组件注入全局
export const store = configureStore({
  reducer: {
    stateModule: stateModule.reducer,
  },
});
