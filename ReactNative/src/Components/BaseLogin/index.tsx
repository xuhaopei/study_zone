/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import styles from './styles.tsx';
import React, {useEffect, useState} from 'react';
import {
  Modal,
  Text,
  View,
  Image,
  TextInput,
  Button,
  Keyboard,
  TouchableWithoutFeedback,
  ToastAndroid,
} from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

// 引入store相关
import {useSelector, useDispatch} from 'react-redux';
import {
  setIsShowLogin,
  State,
  setUseInfo,
  setLoading,
  getBalanceInfos,
  asyncActionSetUserInfo
} from 'src/store/stateModule.ts';

import Apis from '../../Api/user.ts';

import { userInfoRealm } from 'src/storeLocal/index.ts';
// GoogleSignin.configure({
//   webClientId:
//     '1004579576139-mthd82o8p7kdjl6uan5i4g3bjvvbb44j.apps.googleusercontent.com', // client ID of type WEB for your server. Required to get the `idToken` on the user object, and for offline access.
//   scopes: ['https://www.googleapis.com/auth/drive.readonly'], // what API you want to access on behalf of the user, default is email and profile
//   offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
//   hostedDomain: '', // specifies a hosted domain restriction
//   forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`, read the docs link below *.
//   accountName: '', // [Android] specifies an account name on the device that should be used
//   iosClientId:
//     '1004579576139-mthd82o8p7kdjl6uan5i4g3bjvvbb44j.apps.googleusercontent.com', // [iOS] if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
//   googleServicePlistPath: '', // [iOS] if you renamed your GoogleService-Info file, new name here, e.g. GoogleService-Info-Staging
//   openIdRealm: '', // [iOS] The OpenID2 realm of the home web server. This allows Google to include the user's OpenID Identifier in the OpenID Connect ID token.
//   profileImageSize: 120, // [iOS] The desired height (and width) of the profile image. Defaults to 120px
// });
export default (): React.JSX.Element => {
  const [zone] = useState('+86');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const state = useSelector((states: any) => states.stateModule) as State;
  const dispatch = useDispatch();
  const handleLogin = async () => {
    dispatch(setLoading(true));
    let {data, message} = await Apis.accountLogin({
      account_type: 1,
      nation_code: zone.replace('+', ''),
      phone: zone.replace('+', '') + phone.trim(),
      code: code,
    });
    console.log(data);
    ToastAndroid.show(message, ToastAndroid.SHORT);
    dispatch(setUseInfo(data));
    dispatch(setIsShowLogin(false));
    dispatch(setLoading(false));
    getBalanceInfos(dispatch)
    userInfoRealm.write(() => {
      userInfoRealm.create('UserInfo', {id: 0, data: JSON.stringify(data)})
    })
  };
  const handleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log('userInfo', userInfo);
    } catch (error: any) {
      console.log('error', error);
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          // user cancelled the login flow
          break;
        case statusCodes.IN_PROGRESS:
          // operation (eg. sign in) already in progress
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          // play services not available or outdated
          break;
        default:
        // some other error happened
      }
    }
  };
  useEffect(() => {
    console.log('state1', state);
  }, [state]);
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={state.isShowLogin}
      onRequestClose={() => {}}>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.wrapper}>
          <View
            style={styles.bg}
            onTouchEnd={() => dispatch(setIsShowLogin(false))}
          />
          <View style={styles.container}>
            <Image
              style={styles.imageLogo}
              source={require('../../img/logo.png')}
            />
            <Text style={styles.textTip}>
              未注册用户将自动注册，已注册用户直接登录
            </Text>
            <View style={{...styles.inputWrapper}}>
              <Text style={styles.zone}>{zone}</Text>
              <View style={styles.line} />
              <TextInput
                style={styles.inputNum}
                onChangeText={text => setPhone(text)}
                value={phone}
                placeholder="请输入手机号码"
                placeholderTextColor={'gray'}
                keyboardType="numeric"
              />
            </View>
            <View
              // eslint-disable-next-line react-native/no-inline-styles
              style={{
                ...styles.inputWrapper,
                justifyContent: 'space-between',
              }}>
              <TextInput
                style={styles.inputNum}
                onChangeText={text => setCode(text)}
                value={code}
                placeholder="请输入验证码"
                placeholderTextColor={'gray'}
                keyboardType="numeric"
              />
              <Button
                title="获取验证码"
                color="#3C3B3B"
                onPress={() => Keyboard.dismiss()}
              />
            </View>
            <Text style={styles.btnLogin} onPress={handleLogin}>
              登录
            </Text>
            <Text style={styles.otherLoginWay}>其他登录方式</Text>
            <Text style={styles.google} onPress={handleSignIn}>
              Google
            </Text>
            <View style={styles.loginTipWrapper}>
              <Text style={styles.loginTip}>
                注册登录即代表你已满法定年龄并同意
              </Text>
              <Text style={styles.item}>条款</Text>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
