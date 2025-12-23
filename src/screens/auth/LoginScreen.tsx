import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
  Animated,
  Keyboard,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from '../../Components/Common/View/ResponsiveDesign';
import {fonts} from '../../Helper/fontsUtils';
import {AuthService} from '../../services';
import {setUser, setLoading} from '../../Redux/authSlice';

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
    outputRange: [0, -15],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 0.5, 0.2],
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

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoadingState] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [inputPositions, setInputPositions] = useState<{[key: string]: number}>({});

  useEffect(() => {
    AsyncStorage.getItem('isLoggedIn').then(isLoggedIn => {
      if (isLoggedIn === 'Yes') {
        (navigation as any).reset({
          index: 0,
          routes: [{name: 'ChatListScreen'}],
        });
      }
    });
  }, [navigation]);

  const handleInputLayout = (key: string) => (event: any) => {
    const {y} = event.nativeEvent.layout;
    setInputPositions(prev => ({...prev, [key]: y}));
  };

  const scrollToInput = (key: string) => {
    setTimeout(() => {
      const y = inputPositions[key];
      if (y !== undefined && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: y - 100,
          animated: true,
        });
      }
    }, 100);
  };

  const validateInputs = (): boolean => {
    let isValid = true;
    setIdentifierError('');
    setPasswordError('');
    setGeneralError('');

    if (!identifier.trim()) {
      setIdentifierError('Email, username, or phone is required');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!validateInputs()) {
      return;
    }

    setLoadingState(true);
    setGeneralError('');

    try {
      const user = await AuthService.loginWithEmail(identifier.trim(), password);

      dispatch(setUser(user));
      dispatch(setLoading(false));

      setTimeout(() => {
        (navigation as any).reset({
          index: 0,
          routes: [{name: 'ChatListScreen'}],
        });
      }, 100);
    } catch (error: any) {
      setLoadingState(false);
      dispatch(setLoading(false));

      if (error?.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            setGeneralError('No account found with this email');
            break;
          case 'auth/wrong-password':
            setGeneralError('Incorrect password');
            break;
          case 'auth/invalid-email':
            setIdentifierError('Invalid email format');
            break;
          case 'auth/user-disabled':
            setGeneralError('This account has been disabled');
            break;
          case 'auth/too-many-requests':
            setGeneralError('Too many failed attempts. Please try again later');
            break;
          case 'auth/network-request-failed':
            setGeneralError('Network error. Please check your connection');
            break;
          case 'auth/invalid-credential':
            setGeneralError('Invalid email or password');
            break;
          default:
            setGeneralError(error.message || 'Login failed. Please try again');
        }
      } else {
        setGeneralError(error.message || 'An unexpected error occurred');
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      <Particle size={5} top={80} left={30} delay={0} />
      <Particle size={6} top={150} left={320} delay={2} />
      <Particle size={4} top={250} left={60} delay={4} />
      <Particle size={5} top={450} left={300} delay={1} />
      <Particle size={4} top={600} left={40} delay={3} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.scrollContent, {paddingTop: insets.top + verticalScale(20)}]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <View style={styles.chatIconContainer}>
                <View style={styles.chatBubble}>
                  <View style={styles.chatSmile} />
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.title}>Sign In to Chat</Text>
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>First time here? </Text>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('RegisterScreen')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {generalError ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={20} color="#DC2626" />
              <Text style={styles.errorText}>{generalError}</Text>
            </View>
          ) : null}

          <View
            style={styles.inputContainer}
            onLayout={handleInputLayout('identifier')}>
            <View style={styles.inputWrapper}>
              <Icon name="mail-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Email / Username / Phone"
                placeholderTextColor="#9CA3AF"
                value={identifier}
                onChangeText={text => {
                  setIdentifier(text);
                  setIdentifierError('');
                  setGeneralError('');
                }}
                onFocus={() => scrollToInput('identifier')}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {identifierError ? (
              <View style={styles.fieldErrorContainer}>
                <Icon name="warning" size={14} color="#DC2626" />
                <Text style={styles.fieldError}>{identifierError}</Text>
              </View>
            ) : null}
          </View>

          <View
            style={styles.inputContainer}
            onLayout={handleInputLayout('password')}>
            <View style={styles.inputWrapper}>
              <Icon name="lock-closed-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  setPasswordError('');
                  setGeneralError('');
                }}
                onFocus={() => scrollToInput('password')}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}>
                <Icon
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <View style={styles.fieldErrorContainer}>
                <Icon name="warning" size={14} color="#DC2626" />
                <Text style={styles.fieldError}>{passwordError}</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.signInButton, loading && styles.signInButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.signInButtonText}>Sign In</Text>
                <Icon name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={() => (navigation as any).navigate('ForgotPasswordScreen')}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Text style={styles.orText}>or sign in with</Text>
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton}>
              <FontAwesome name="google" size={20} color="#DB4437" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <FontAwesome name="facebook" size={20} color="#4267B2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <FontAwesome name="twitter" size={20} color="#1DA1F2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <FontAwesome name="apple" size={20} color="#000000" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: '#5B8FE8',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: horizontalScale(24),
    paddingTop: verticalScale(40),
    paddingBottom: verticalScale(30),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },
  logoBox: {
    width: horizontalScale(80),
    height: horizontalScale(80),
    borderRadius: moderateScale(20),
    backgroundColor: '#5B8FE8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  chatIconContainer: {
    width: '60%',
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBubble: {
    width: horizontalScale(35),
    height: horizontalScale(32),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(8),
    borderBottomLeftRadius: moderateScale(3),
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatSmile: {
    width: horizontalScale(20),
    height: horizontalScale(10),
    borderBottomLeftRadius: moderateScale(10),
    borderBottomRightRadius: moderateScale(10),
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: '#5B8FE8',
    marginTop: verticalScale(3),
  },
  title: {
    fontSize: moderateScale(24),
    ...fonts.bold,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: verticalScale(8),
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },
  signupText: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: '#6B7280',
  },
  signupLink: {
    fontSize: moderateScale(14),
    ...fonts.semiBold,
    color: '#5B8FE8',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginBottom: verticalScale(16),
    gap: horizontalScale(8),
  },
  errorText: {
    flex: 1,
    fontSize: moderateScale(13),
    ...fonts.medium,
    color: '#DC2626',
  },
  inputContainer: {
    marginBottom: verticalScale(16),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: moderateScale(12),
    paddingHorizontal: horizontalScale(16),
    height: verticalScale(52),
    backgroundColor: '#F9FAFB',
    gap: horizontalScale(12),
  },
  input: {
    flex: 1,
    fontSize: moderateScale(15),
    ...fonts.regular,
    color: '#1F2937',
  },
  eyeIcon: {
    padding: moderateScale(8),
  },
  fieldErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(4),
    marginLeft: horizontalScale(16),
    gap: horizontalScale(4),
  },
  fieldError: {
    fontSize: moderateScale(12),
    ...fonts.regular,
    color: '#DC2626',
  },
  signInButton: {
    flexDirection: 'row',
    backgroundColor: '#5B8FE8',
    borderRadius: moderateScale(12),
    height: verticalScale(52),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(8),
    shadowColor: '#5B8FE8',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    gap: horizontalScale(8),
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    fontSize: moderateScale(16),
    ...fonts.semiBold,
    color: '#FFFFFF',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: verticalScale(16),
    marginBottom: verticalScale(24),
  },
  forgotPasswordText: {
    fontSize: moderateScale(14),
    ...fonts.medium,
    color: '#5B8FE8',
  },
  orText: {
    fontSize: moderateScale(13),
    ...fonts.regular,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: verticalScale(16),
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: horizontalScale(16),
  },
  socialButton: {
    width: horizontalScale(52),
    height: horizontalScale(52),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default LoginScreen;
