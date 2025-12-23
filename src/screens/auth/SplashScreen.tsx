import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, StatusBar, Text, Animated} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDispatch} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from '../../Components/Common/View/ResponsiveDesign';
import {fonts} from '../../Helper/fontsUtils';
import {setUser, setLoading} from '../../Redux/authSlice';
import {onAuthStateChanged} from '../../firebase/auth';
import {Dimensions} from 'react-native';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

const Particle: React.FC<{
  size: number;
  top: number;
  left: number;
  delay: number;
}> = ({size, top, left, delay}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 3000 + delay * 100,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 3000 + delay * 100,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [animatedValue, delay]);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.8, 0.3],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          top,
          left,
          opacity,
          transform: [{translateY}],
        },
      ]}
    />
  );
};

const SplashScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let isNavigating = false;
    
    const checkAuthAndNavigate = async () => {
      if (isNavigating) {
        return;
      }
      
      try {
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
        const userData = await AsyncStorage.getItem('userData');
        
        setTimeout(() => {
          if (isNavigating) {
            return;
          }
          
          if (isLoggedIn === 'Yes' && userData) {
            try {
              const user = JSON.parse(userData);
              isNavigating = true;
              dispatch(setUser(user));
              dispatch(setLoading(false));
              (navigation as any).reset({
                index: 0,
                routes: [{name: 'ChatListScreen'}],
              });
            } catch {
              dispatch(setLoading(false));
              isNavigating = true;
              (navigation as any).reset({
                index: 0,
                routes: [{name: 'LoginScreen'}],
              });
            }
          } else {
            dispatch(setLoading(false));
            isNavigating = true;
            (navigation as any).reset({
              index: 0,
              routes: [{name: 'LoginScreen'}],
            });
          }
        }, 2000);
      } catch {
        dispatch(setLoading(false));
        setTimeout(() => {
          if (!isNavigating) {
            isNavigating = true;
            (navigation as any).reset({
              index: 0,
              routes: [{name: 'LoginScreen'}],
            });
          }
        }, 2000);
      }
    };

    const unsubscribe = onAuthStateChanged(async () => {
      if (!isNavigating) {
        checkAuthAndNavigate();
      }
    });

    checkAuthAndNavigate();

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar backgroundColor="#5B8FE8" barStyle="light-content" />
      
      <View style={styles.gradientOverlay} />
      
      <Particle size={6} top={SCREEN_HEIGHT * 0.1} left={50} delay={0} />
      <Particle size={8} top={SCREEN_HEIGHT * 0.2} left={300} delay={2} />
      <Particle size={5} top={SCREEN_HEIGHT * 0.35} left={90} delay={4} />
      <Particle size={7} top={SCREEN_HEIGHT * 0.45} left={280} delay={1} />
      <Particle size={6} top={SCREEN_HEIGHT * 0.6} left={70} delay={3} />
      <Particle size={9} top={SCREEN_HEIGHT * 0.7} left={320} delay={5} />
      <Particle size={5} top={SCREEN_HEIGHT * 0.8} left={110} delay={2} />
      <Particle size={7} top={SCREEN_HEIGHT * 0.15} left={240} delay={4} />
      <Particle size={6} top={SCREEN_HEIGHT * 0.5} left={340} delay={1} />
      <Particle size={8} top={SCREEN_HEIGHT * 0.75} left={190} delay={3} />
      
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <View style={styles.chatIconContainer}>
            <View style={styles.chatBubble}>
              <View style={styles.chatSmile} />
            </View>
          </View>
        </View>
        <Text style={styles.appName}>Chat</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5B8FE8',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '70%',
    height: '70%',
    backgroundColor: 'rgba(74, 127, 214, 0.4)',
    borderBottomRightRadius: 500,
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  logoContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  logoBox: {
    width: horizontalScale(100),
    height: horizontalScale(100),
    borderRadius: moderateScale(24),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  chatIconContainer: {
    width: '70%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBubble: {
    width: horizontalScale(50),
    height: horizontalScale(45),
    backgroundColor: '#5B8FE8',
    borderRadius: moderateScale(12),
    borderBottomLeftRadius: moderateScale(4),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  chatSmile: {
    width: horizontalScale(30),
    height: horizontalScale(15),
    borderBottomLeftRadius: moderateScale(15),
    borderBottomRightRadius: moderateScale(15),
    borderWidth: 3,
    borderTopWidth: 0,
    borderColor: '#FFFFFF',
    marginTop: verticalScale(5),
  },
  appName: {
    fontSize: moderateScale(32),
    ...fonts.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: verticalScale(4),
  },
  companyName: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.3,
  },
});

export default SplashScreen;
