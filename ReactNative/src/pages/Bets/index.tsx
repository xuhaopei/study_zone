/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import styles from './styles.tsx';
import React from 'react';
import {View, Button, Text} from 'react-native';
// 引入store相关
import {useSelector, useDispatch} from 'react-redux';
import {State} from 'src/store/stateModule.ts';
// 引入组件

export default ({navigation}): React.JSX.Element => {
  // 引入store相关
  const state = useSelector((states: any) => states.stateModule) as State;

  return <View style={styles.wrapper}>
    <Text>casino</Text>
  </View>;
};
