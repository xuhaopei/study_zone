/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {SafeAreaView, useColorScheme} from 'react-native';
import {Provider} from 'react-redux';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {store} from 'src/store/index.ts';
// 引入组件
import Home from 'src/pages/Home/index.tsx';
function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  return (
    <Provider store={store}>
      <SafeAreaView style={backgroundStyle}>
        <Home />
      </SafeAreaView>
    </Provider>
  );
}

export default App;
