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
  return <View style={styles.wrapper}>
    <View style={styles.wrapper}>
      <Image></Image>
      <Text></Text>
    </View>
    <Image source={require('src/img/user.png')}></Image>
  </View>;
};
