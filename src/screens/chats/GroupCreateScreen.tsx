import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from '../../Components/Common/View/ResponsiveDesign';
import {colors} from '../../Helper/colors';
import {fonts} from '../../Helper/fontsUtils';
import CustomTextInput from '../../Components/Common/CustomTextInput';
import {ChatService} from '../../services';
import {addChat, setCurrentChat} from '../../Redux/chatSlice';
import strings from '../../Constants/strings';
import Loader from '../../Components/Common/View/Loader';

const GroupCreateScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {user} = useSelector((state: any) => state.auth);
  const insets = useSafeAreaInsets();

  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setNameError('Group name is required');
      return;
    }

    if (!user) return;

    try {
      setLoading(true);
      const chat = await ChatService.createGroupChat(
        [user.uid],
        {
          name: groupName,
          description: groupDescription || undefined,
          createdBy: user.uid,
          admins: [user.uid],
          members: [user.uid],
        },
        user.uid,
      );

      dispatch(addChat(chat));
      dispatch(setCurrentChat(chat));
      navigation.navigate('ChatScreen' as never, {chatId: chat.chatId});
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      <View style={[styles.header, {paddingTop: insets.top + verticalScale(12)}]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>{strings.cancel}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{strings.createGroup}</Text>
        <TouchableOpacity onPress={handleCreateGroup}>
          <Text style={styles.doneButton}>{strings.done}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <CustomTextInput
          label={strings.groupName}
          placeholder="Enter group name"
          value={groupName}
          onChangeText={text => {
            setGroupName(text);
            setNameError('');
          }}
          error={nameError}
        />

        <CustomTextInput
          label={strings.groupDescription}
          placeholder="Enter group description (optional)"
          value={groupDescription}
          onChangeText={setGroupDescription}
          multiline
          numberOfLines={4}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: horizontalScale(16),
    paddingBottom: verticalScale(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    fontSize: moderateScale(16),
    ...fonts.medium,
    color: colors.white,
  },
  headerTitle: {
    fontSize: moderateScale(18),
    ...fonts.semiBold,
    color: colors.white,
  },
  doneButton: {
    fontSize: moderateScale(16),
    ...fonts.semiBold,
    color: colors.white,
  },
  content: {
    padding: horizontalScale(16),
  },
});

export default GroupCreateScreen;

