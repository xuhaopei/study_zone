/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import styles from './styles.tsx';
import React from 'react';
import {View, Button} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
// 引入store相关
import {useSelector, useDispatch} from 'react-redux';
import {setIsShowLogin, State} from 'src/store/stateModule.ts';
// 引入组件
import Login from 'src/Components/Login';
import Loading from 'src/Components/Loading/index.tsx';
import HomeSetting from '../HomeSetting/index.tsx';

const Stack = createNativeStackNavigator();
export default ({navigation}): React.JSX.Element => {
  // 引入store相关
  const state = useSelector((states: any) => states.stateModule) as State;
  const dispatch = useDispatch();

  const handleLogin = () => {
    dispatch(setIsShowLogin(true));
  };
  const handleGotoPreivew = () => {
    navigation.navigate('Preview', {data: '这是路由数据'});
  };
  return (
    <View style={styles.wrapper}>
      <Button onPress={handleLogin} title="login" />
      <Button onPress={handleGotoPreivew} title="go to preview" />
      {state.isShowLogin && <Login />}
      <Loading />
      <Stack.Navigator initialRouteName="HomeSetting">
        <Stack.Screen name="HomeSetting" component={HomeSetting} />
      </Stack.Navigator>
    </View>
  );
};
