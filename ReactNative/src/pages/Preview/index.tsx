/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import styles from './styles.tsx';
import React from 'react';
import {View, Text, Button} from 'react-native';

export default ({route, navigation}): React.JSX.Element => {
  const {data} = route.params;
  return (
    <View style={styles.wrapper}>
      <Text>{data}</Text>
      <Button title="back" onPress={() => navigation.goBack()} />
      <Button title="navigate" onPress={() => navigation.navigate('Home')} />
    </View>
  );
};
