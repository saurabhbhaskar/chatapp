import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from '../../Components/Common/View/ResponsiveDesign';
import {colors} from '../../Helper/colors';
import {fonts} from '../../Helper/fontsUtils';
import {ChatService} from '../../services';
import {Chat, User} from '../../types';
import {getUser} from '../../firebase/database';
import Avatar from '../../Components/Common/Avatar';
import {TimeUtils} from '../../Helper/TimeUtils';

const GroupInfoScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {chatId} = route.params as {chatId: string};
  const {user} = useSelector((state: any) => state.auth);
  const insets = useSafeAreaInsets();
  
  const [chat, setChat] = useState<Chat | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = ChatService.watchChat(chatId, async (chatData) => {
      if (chatData) {
        setChat(chatData);
        
        // For direct chat, get the other user's info
        if (chatData.type === 'direct' && user) {
          const participants = Array.isArray(chatData.participants)
            ? chatData.participants
            : Object.keys(chatData.participants || {});
          const otherUserId = participants.find((id: string) => id !== user.uid);
          if (otherUserId) {
            const userData = await getUser(otherUserId);
            if (userData) {
              setOtherUser(userData);
            }
          }
        }
        
        // For group chat, get all members' info
        if (chatData.type === 'group' && chatData.participants) {
          const participantIds = Array.isArray(chatData.participants)
            ? chatData.participants
            : Object.keys(chatData.participants || {});
          
          const memberPromises = participantIds.map((uid: string) => getUser(uid));
          const memberData = await Promise.all(memberPromises);
          setMembers(memberData.filter((u): u is User => u !== null));
        }
        
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [chatId, user]);

  const getParticipantsArray = (participants: any): string[] => {
    if (!participants) return [];
    if (Array.isArray(participants)) return participants;
    if (typeof participants === 'object') return Object.keys(participants);
    return [];
  };

  const renderUserProfile = () => {
    if (!otherUser) return null;

    return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Avatar
            name={otherUser.displayName || otherUser.email || otherUser.username || 'User'}
            imageUri={otherUser.photoURL}
            size={100}
          />
          <Text style={styles.profileName}>
            {otherUser.displayName || otherUser.username || 'User'}
          </Text>
          {otherUser.status && (
            <Text style={styles.statusText}>
              {otherUser.status === 'online' ? 'Online' : 'Offline'}
            </Text>
          )}
        </View>

        {/* Profile Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          {otherUser.displayName && (
            <View style={styles.infoRow}>
              <Icon name="person-outline" size={20} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Display Name</Text>
                <Text style={styles.infoValue}>{otherUser.displayName}</Text>
              </View>
            </View>
          )}

          {otherUser.username && (
            <View style={styles.infoRow}>
              <Icon name="at-outline" size={20} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Username</Text>
                <Text style={styles.infoValue}>{otherUser.username}</Text>
              </View>
            </View>
          )}

          {otherUser.email && (
            <View style={styles.infoRow}>
              <Icon name="mail-outline" size={20} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{otherUser.email}</Text>
              </View>
            </View>
          )}

          {otherUser.phoneNumber && (
            <View style={styles.infoRow}>
              <Icon name="call-outline" size={20} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{otherUser.phoneNumber}</Text>
              </View>
            </View>
          )}

          {otherUser.lastSeen && (
            <View style={styles.infoRow}>
              <Icon name="time-outline" size={20} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Last Seen</Text>
                <Text style={styles.infoValue}>
                  {TimeUtils.formatDate(otherUser.lastSeen)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderGroupInfo = () => {
    if (!chat || !chat.groupInfo) return null;

    const participantIds = getParticipantsArray(chat.participants);
    const isOwner = chat.groupInfo.createdBy === user?.uid;
    const isAdmin = chat.groupInfo.admins?.includes(user?.uid) || false;

    return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Group Header */}
        <View style={styles.profileHeader}>
          <Avatar
            name={chat.groupInfo.name}
            imageUri={chat.groupInfo.photoURL}
            size={100}
          />
          <Text style={styles.profileName}>{chat.groupInfo.name}</Text>
          {chat.groupInfo.description && (
            <Text style={styles.groupDescription}>{chat.groupInfo.description}</Text>
          )}
          <Text style={styles.memberCount}>
            {participantIds.length} {participantIds.length === 1 ? 'member' : 'members'}
          </Text>
        </View>

        {/* Group Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Details</Text>
          
          {chat.groupInfo.description && (
            <View style={styles.infoRow}>
              <Icon name="information-circle-outline" size={20} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Description</Text>
                <Text style={styles.infoValue}>{chat.groupInfo.description}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <Icon name="people-outline" size={20} color={colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>
                {TimeUtils.formatDate(chat.createdAt)}
              </Text>
            </View>
          </View>

          {(isOwner || isAdmin) && (
            <View style={styles.infoRow}>
              <Icon name="shield-checkmark-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Your Role</Text>
                <Text style={[styles.infoValue, {color: colors.primary}]}>
                  {isOwner ? 'Owner' : 'Admin'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members ({members.length})</Text>
            {(isOwner || isAdmin) && (
              <TouchableOpacity
                onPress={() => {
                  (navigation as any).navigate('AddMembersScreen', {chatId});
                }}
                style={styles.addButton}>
                <Icon name="add" size={20} color={colors.primary} />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {members.map((member) => {
            const isMemberOwner = chat.groupInfo?.createdBy === member.uid;
            const isMemberAdmin = chat.groupInfo?.admins?.includes(member.uid) || false;
            const isCurrentUser = member.uid === user?.uid;

            return (
              <TouchableOpacity
                key={member.uid}
                style={styles.memberRow}
                activeOpacity={0.7}>
                <Avatar
                  name={member.displayName || member.email || member.username || 'User'}
                  imageUri={member.photoURL}
                  size={50}
                />
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName}>
                      {member.displayName || member.username || member.email || 'User'}
                      {isCurrentUser && ' (You)'}
                    </Text>
                    {isMemberOwner && (
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>Owner</Text>
                      </View>
                    )}
                    {!isMemberOwner && isMemberAdmin && (
                      <View style={[styles.roleBadge, styles.adminBadge]}>
                        <Text style={styles.roleBadgeText}>Admin</Text>
                      </View>
                    )}
                  </View>
                  {member.email && (
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  )}
                  {member.status && (
                    <Text style={styles.memberStatus}>
                      {member.status === 'online' ? 'Online' : 'Offline'}
                    </Text>
                  )}
                </View>
                {(isOwner || isAdmin) && !isCurrentUser && (
                  <TouchableOpacity style={styles.memberActionButton}>
                    <Icon name="ellipsis-vertical" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
        <View style={[styles.header, {paddingTop: insets.top + verticalScale(12)}]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {chat?.type === 'group' ? 'Group Info' : 'Profile'}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      <View style={[styles.header, {paddingTop: insets.top + verticalScale(12)}]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {chat?.type === 'group' ? 'Group Info' : 'Profile'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {chat?.type === 'group' ? renderGroupInfo() : renderUserProfile()}
    </View>
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
  headerTitle: {
    fontSize: moderateScale(18),
    ...fonts.semiBold,
    color: colors.white,
  },
  placeholder: {
    width: horizontalScale(24),
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: verticalScale(24),
    paddingHorizontal: horizontalScale(16),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileName: {
    fontSize: moderateScale(22),
    ...fonts.bold,
    color: colors.text,
    marginTop: verticalScale(12),
    textAlign: 'center',
  },
  groupDescription: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: colors.textSecondary,
    marginTop: verticalScale(8),
    textAlign: 'center',
    paddingHorizontal: horizontalScale(20),
  },
  memberCount: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: colors.textSecondary,
    marginTop: verticalScale(4),
  },
  statusText: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: colors.success,
    marginTop: verticalScale(4),
  },
  section: {
    backgroundColor: colors.white,
    paddingVertical: verticalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(16),
    marginBottom: verticalScale(12),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    ...fonts.semiBold,
    color: colors.text,
    paddingHorizontal: horizontalScale(16),
    marginBottom: verticalScale(12),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoContent: {
    flex: 1,
    marginLeft: horizontalScale(12),
  },
  infoLabel: {
    fontSize: moderateScale(12),
    ...fonts.regular,
    color: colors.textSecondary,
    marginBottom: verticalScale(4),
  },
  infoValue: {
    fontSize: moderateScale(16),
    ...fonts.regular,
    color: colors.text,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberInfo: {
    flex: 1,
    marginLeft: horizontalScale(12),
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: moderateScale(16),
    ...fonts.semiBold,
    color: colors.text,
    marginRight: horizontalScale(8),
  },
  memberEmail: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: colors.textSecondary,
    marginTop: verticalScale(2),
  },
  memberStatus: {
    fontSize: moderateScale(12),
    ...fonts.regular,
    color: colors.success,
    marginTop: verticalScale(2),
  },
  roleBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: horizontalScale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(4),
  },
  adminBadge: {
    backgroundColor: colors.secondary,
  },
  roleBadgeText: {
    fontSize: moderateScale(10),
    ...fonts.semiBold,
    color: colors.white,
  },
  memberActionButton: {
    padding: horizontalScale(8),
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(6),
  },
  addButtonText: {
    fontSize: moderateScale(14),
    ...fonts.semiBold,
    color: colors.primary,
    marginLeft: horizontalScale(4),
  },
});

export default GroupInfoScreen;
