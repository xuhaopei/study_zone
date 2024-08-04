/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Image, Text, View} from 'react-native';
import styles from './styles';
// 引入公共组件
import BaseHeader from 'src/Components/BaseHeader';
import BaseLogin from 'src/Components/BaseLogin';
import BaseLoading from 'src/Components/BaseLoading';
// 引入页面组件
import Casino from 'src/pages/Casino';
import Browse from 'src/pages/Browse';
import Bets from 'src/pages/Bets';

// 引入store相关
import {useSelector, useDispatch} from 'react-redux';
import {setIsShowLogin, State} from 'src/store/stateModule.ts';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const Home = (): React.JSX.Element => {
  return (
    <Tab.Navigator
      initialRouteName="Casino"
      screenOptions={({route}) => ({
        tabBarStyle: styles.tabBarStyle,
        header(props) {
          return <BaseHeader></BaseHeader>;
        },
      })}
      sceneContainerStyle={{backgroundColor: 'rgb(35, 34, 39)'}}>
      <Tab.Screen
        name="Browse"
        component={Browse}
        options={{
          tabBarIcon({focused}) {
            let url = focused
              ? require('src/img/browse.png')
              : require('src/img/browseGray.png');
            return <Image style={styles.icon} source={url}></Image>;
          },
          tabBarLabel({focused}) {
            return (
              <Text
                style={focused ? styles.labelActivty : styles.labelUnActivity}>
                Browse
              </Text>
            );
          },
        }}
      />
      <Tab.Screen
        name="Casino"
        component={Casino}
        options={{
          tabBarIcon({focused}) {
            let url = focused
              ? require('src/img/casino.png')
              : require('src/img/casinoGray.png');
            return <Image style={styles.icon} source={url}></Image>;
          },
          tabBarLabel({focused}) {
            return (
              <Text
                style={focused ? styles.labelActivty : styles.labelUnActivity}>
                Casino
              </Text>
            );
          },
        }}
      />
      <Tab.Screen
        name="Bets"
        component={Bets}
        options={{
          tabBarIcon({focused}) {
            let url = focused
              ? require('src/img/bets.png')
              : require('src/img/betsGray.png');
            return <Image style={styles.icon} source={url}></Image>;
          },
          tabBarLabel({focused}) {
            return (
              <Text
                style={focused ? styles.labelActivty : styles.labelUnActivity}>
                Bets
              </Text>
            );
          },
        }}
      />
    </Tab.Navigator>
  );
};
// 根组件
export const Root = (): React.JSX.Element => {
  // 引入store相关
  const state = useSelector((states: any) => states.stateModule) as State;
  const dispatch = useDispatch();
  return (
    <View style={{flex: 1}}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen
            name="Home"
            component={Home}
            options={{headerShown: false}}
          />
          {/* <Stack.Screen name="Preview" component={() => null} /> */}
        </Stack.Navigator>
      </NavigationContainer>
      {state.isShowLogin && <BaseLogin />}
      <BaseLoading />
    </View>
  );
};
