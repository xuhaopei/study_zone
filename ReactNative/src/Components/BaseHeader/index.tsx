/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import styles from './styles.tsx';
import React from 'react';
import {View, Image, Text} from 'react-native';
// 引入store相关
import {useSelector, useDispatch} from 'react-redux';
import {setIsShowLogin, State} from 'src/store/stateModule.ts';

export default (): React.JSX.Element => {
  // 引入store相关
  const state = useSelector((states: any) => states.stateModule) as State;
  const dispatch = useDispatch();
  const handleLogin = () => {
    dispatch(setIsShowLogin(true));
  };
  return (
    <View style={styles.wrapper}>
      <Image style={styles.img} source={require('src/img/icon.png')}></Image>
      {
        !state.useInfo && <Text onPress={handleLogin} style={styles.unLogin}>Log in / Register</Text>
      }
    </View>
  );
};
