import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from '../../Components/Common/View/ResponsiveDesign';
import {colors} from '../../Helper/colors';
import {fonts} from '../../Helper/fontsUtils';
import CustomTextInput from '../../Components/Common/CustomTextInput';
import {ValidationUtils} from '../../Helper/ValidationUtils';
import {ErrorUtils} from '../../Helper/ErrorUtils';
import {AuthService} from '../../services';
import strings from '../../Constants/strings';
import Loader from '../../Components/Common/View/Loader';

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoadingState] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setEmailError(strings.emailRequired);
      return false;
    } else if (!ValidationUtils.isValidEmail(email)) {
      setEmailError(strings.emailInvalid);
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoadingState(true);
      await AuthService.resetPassword(email);
      setSuccess(true);
    } catch (error: any) {
      ErrorUtils.handleApiError(error, dispatch, strings.somethingWentWrong);
    } finally {
      setLoadingState(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar backgroundColor={colors.white} barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, {paddingTop: insets.top}]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{strings.resetPassword}</Text>
            <Text style={styles.subtitle}>
              {success
                ? strings.passwordResetSent
                : 'Enter your email to reset your password'}
            </Text>
          </View>

          {!success ? (
            <View style={styles.form}>
              <CustomTextInput
                label={strings.email}
                placeholder={strings.enterEmail}
                value={email}
                onChangeText={text => {
                  setEmail(text);
                  setEmailError('');
                }}
                error={emailError}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleResetPassword}
                disabled={loading}>
                <Text style={styles.resetButtonText}>
                  {strings.resetPassword}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('LoginScreen' as never)}>
              <Text style={styles.backButtonText}>{strings.back}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: horizontalScale(24),
    justifyContent: 'center',
  },
  header: {
    marginBottom: verticalScale(40),
    alignItems: 'center',
  },
  title: {
    fontSize: moderateScale(32),
    ...fonts.bold,
    color: colors.text,
    marginBottom: verticalScale(8),
  },
  subtitle: {
    fontSize: moderateScale(16),
    ...fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  resetButton: {
    backgroundColor: colors.primary,
    height: verticalScale(50),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(8),
  },
  resetButtonText: {
    fontSize: moderateScale(16),
    ...fonts.semiBold,
    color: colors.white,
  },
  backButton: {
    backgroundColor: colors.primary,
    height: verticalScale(50),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(8),
  },
  backButtonText: {
    fontSize: moderateScale(16),
    ...fonts.semiBold,
    color: colors.white,
  },
});

export default ForgotPasswordScreen;

