/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import styles from './styles.tsx';
import React from 'react';
import {View, Button} from 'react-native';
// 引入store相关
import {useSelector, useDispatch} from 'react-redux';
import {setIsShowLogin, State} from 'src/store/stateModule.ts';
// 引入组件
import Login from 'src/Components/Login';
export default (): React.JSX.Element => {
  // 引入store相关
  const state = useSelector((states: any) => states.stateModule) as State;
  const dispatch = useDispatch();

  const handleLogin = () => {
    dispatch(setIsShowLogin(true));
  };
  return (
    <View style={styles.wrapper}>
      <Button onPress={handleLogin} title="login" />
      {state.isShowLogin && <Login />}
    </View>
  );
};
