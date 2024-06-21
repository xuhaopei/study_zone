/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import styles from './styles.tsx';
import React from 'react';
import {View, ActivityIndicator, Modal} from 'react-native';

// 引入store相关
import {useSelector} from 'react-redux';
import {State} from 'src/store/stateModule.ts';

export default (): React.JSX.Element => {
  const state = useSelector((states: any) => states.stateModule) as State;
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={state.loading}
      onRequestClose={() => {}}>
      <View style={styles.wrapper}>
        <ActivityIndicator size="large" color="#00ff00" />
      </View>
    </Modal>
  );
};
