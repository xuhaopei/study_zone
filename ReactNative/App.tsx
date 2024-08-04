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
import {Root} from 'src/router';
function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <Root></Root>
    </Provider>
  );
}

export default App;
