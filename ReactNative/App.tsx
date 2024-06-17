/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {Provider} from 'react-redux';
import {store} from 'src/store/index.ts';
// 引入组件
import Home from 'src/pages/Home/index.tsx';
import Preview from 'src/pages/Preview';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();
function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Preview" component={Preview} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}

export default App;
