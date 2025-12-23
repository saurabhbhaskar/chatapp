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
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from '../../Components/Common/View/ResponsiveDesign';
import {fonts} from '../../Helper/fontsUtils';
import {ValidationUtils} from '../../Helper/ValidationUtils';
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

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [displayNameError, setDisplayNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const [loading, setLoadingState] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [inputPositions, setInputPositions] = useState<{[key: string]: number}>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const {height: SCREEN_HEIGHT} = Dimensions.get('window');

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleInputLayout = (key: string) => (event: any) => {
    const {y, height} = event.nativeEvent.layout;
    setInputPositions(prev => ({...prev, [key]: y}));
  };

  const scrollToInput = (key: string) => {
    setTimeout(() => {
      const y = inputPositions[key];
      if (y !== undefined && scrollViewRef.current) {
        const baseOffset = 150;
        const keyboardOffset = keyboardHeight > 0 ? keyboardHeight * 0.3 : 0;
        const totalOffset = baseOffset + keyboardOffset;
        
        scrollViewRef.current.scrollTo({
          y: Math.max(0, y - totalOffset),
          animated: true,
        });
      }
    }, Platform.OS === 'ios' ? 250 : 100);
  };

  const validateInputs = (): boolean => {
    let isValid = true;
    
    setDisplayNameError('');
    setUsernameError('');
    setPhoneError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');

    if (!displayName.trim()) {
      setDisplayNameError('Name is required');
      isValid = false;
    }

    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    } else if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      isValid = false;
    }

    if (phone && !/^\d{10,15}$/.test(phone.replace(/[\s-]/g, ''))) {
      setPhoneError('Please enter a valid phone number');
      isValid = false;
    }

    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!ValidationUtils.isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    if (!validateInputs()) {
      return;
    }

    setLoadingState(true);
    setGeneralError('');

    try {
      const userData = {
        email: email.trim(),
        password: password,
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        phone: phone.trim(),
      };

      const user = await AuthService.registerWithEmail(
        userData.email,
        userData.password,
        userData.displayName,
        userData.username,
        userData.phone,
      );

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
          case 'auth/email-already-in-use':
            setEmailError('This email is already registered');
            break;
          case 'auth/invalid-email':
            setEmailError('Invalid email format');
            break;
          case 'auth/weak-password':
            setPasswordError('Password is too weak');
            break;
          case 'auth/operation-not-allowed':
            setGeneralError('Registration is currently disabled');
            break;
          case 'auth/network-request-failed':
            setGeneralError('Network error. Please check your connection');
            break;
          default:
            setGeneralError(error.message || 'Registration failed. Please try again');
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
      <Particle size={6} top={180} left={320} delay={2} />
      <Particle size={4} top={350} left={50} delay={4} />
      <Particle size={5} top={500} left={300} delay={1} />
      <Particle size={4} top={650} left={40} delay={3} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.keyboardView}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + verticalScale(20),
              paddingBottom: keyboardHeight > 0 ? keyboardHeight + 100 : 100,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled={true}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <View style={styles.chatIconContainer}>
                <View style={styles.chatBubble}>
                  <View style={styles.chatSmile} />
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.title}>Create Account</Text>
          <View style={styles.signinRow}>
            <Text style={styles.signinText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('LoginScreen')}>
              <Text style={styles.signinLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {generalError ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={20} color="#DC2626" />
              <Text style={styles.errorText}>{generalError}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer} onLayout={handleInputLayout('displayName')}>
            <View style={styles.inputWrapper}>
              <Icon name="person-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                placeholderTextColor="#9CA3AF"
                value={displayName}
                onChangeText={text => {
                  setDisplayName(text);
                  setDisplayNameError('');
                  setGeneralError('');
                }}
                onFocus={() => scrollToInput('displayName')}
                autoCapitalize="words"
              />
            </View>
            {displayNameError ? (
              <View style={styles.fieldErrorContainer}>
                <Icon name="warning" size={14} color="#DC2626" />
                <Text style={styles.fieldError}>{displayNameError}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.inputContainer} onLayout={handleInputLayout('username')}>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="at" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Username *"
                placeholderTextColor="#9CA3AF"
                value={username}
                onChangeText={text => {
                  setUsername(text);
                  setUsernameError('');
                  setGeneralError('');
                }}
                onFocus={() => scrollToInput('username')}
                autoCapitalize="none"
              />
            </View>
            {usernameError ? (
              <View style={styles.fieldErrorContainer}>
                <Icon name="warning" size={14} color="#DC2626" />
                <Text style={styles.fieldError}>{usernameError}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.inputContainer} onLayout={handleInputLayout('phone')}>
            <View style={styles.inputWrapper}>
              <Icon name="call-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Phone Number (optional)"
                placeholderTextColor="#9CA3AF"
                value={phone}
                onChangeText={text => {
                  setPhone(text);
                  setPhoneError('');
                  setGeneralError('');
                }}
                onFocus={() => scrollToInput('phone')}
                keyboardType="phone-pad"
              />
            </View>
            {phoneError ? (
              <View style={styles.fieldErrorContainer}>
                <Icon name="warning" size={14} color="#DC2626" />
                <Text style={styles.fieldError}>{phoneError}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.inputContainer} onLayout={handleInputLayout('email')}>
            <View style={styles.inputWrapper}>
              <Icon name="mail-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Email Address *"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={text => {
                  setEmail(text);
                  setEmailError('');
                  setGeneralError('');
                }}
                onFocus={() => scrollToInput('email')}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {emailError ? (
              <View style={styles.fieldErrorContainer}>
                <Icon name="warning" size={14} color="#DC2626" />
                <Text style={styles.fieldError}>{emailError}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.inputContainer} onLayout={handleInputLayout('password')}>
            <View style={styles.inputWrapper}>
              <Icon name="lock-closed-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Password *"
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

          <View style={styles.inputContainer} onLayout={handleInputLayout('confirmPassword')}>
            <View style={styles.inputWrapper}>
              <Icon name="lock-closed-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password *"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={text => {
                  setConfirmPassword(text);
                  setConfirmPasswordError('');
                  setGeneralError('');
                }}
                onFocus={() => scrollToInput('confirmPassword')}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}>
                <Icon
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
            {confirmPasswordError ? (
              <View style={styles.fieldErrorContainer}>
                <Icon name="warning" size={14} color="#DC2626" />
                <Text style={styles.fieldError}>{confirmPasswordError}</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.signUpButtonText}>Sign Up</Text>
                <Icon name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By signing up, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          <Text style={styles.orText}>or sign up with</Text>
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
    paddingTop: verticalScale(30),
    paddingBottom: verticalScale(100),
    flexGrow: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  logoBox: {
    width: horizontalScale(70),
    height: horizontalScale(70),
    borderRadius: moderateScale(18),
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
    width: horizontalScale(32),
    height: horizontalScale(30),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(8),
    borderBottomLeftRadius: moderateScale(3),
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatSmile: {
    width: horizontalScale(18),
    height: horizontalScale(9),
    borderBottomLeftRadius: moderateScale(9),
    borderBottomRightRadius: moderateScale(9),
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: '#5B8FE8',
    marginTop: verticalScale(2),
  },
  title: {
    fontSize: moderateScale(24),
    ...fonts.bold,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: verticalScale(8),
  },
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  signinText: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: '#6B7280',
  },
  signinLink: {
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
    marginBottom: verticalScale(14),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: moderateScale(12),
    paddingHorizontal: horizontalScale(16),
    height: verticalScale(50),
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
  signUpButton: {
    flexDirection: 'row',
    backgroundColor: '#5B8FE8',
    borderRadius: moderateScale(12),
    height: verticalScale(50),
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
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    fontSize: moderateScale(16),
    ...fonts.semiBold,
    color: '#FFFFFF',
  },
  termsText: {
    fontSize: moderateScale(12),
    ...fonts.regular,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: verticalScale(16),
    marginBottom: verticalScale(20),
  },
  termsLink: {
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
    marginBottom: verticalScale(20),
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

export default RegisterScreen;
