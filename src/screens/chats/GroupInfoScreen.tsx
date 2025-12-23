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
import {ChatService, PresenceService} from '../../services';
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
  const [otherUserPresence, setOtherUserPresence] = useState<{online: boolean; lastSeen: number} | null>(null);
  const [membersPresence, setMembersPresence] = useState<{[uid: string]: {online: boolean; lastSeen: number}}>({});

  useEffect(() => {
    if (!chatId) return;

    let presenceUnsubscribes: (() => void)[] = [];

    const unsubscribe = ChatService.watchChat(chatId, async (chatData) => {
      if (chatData) {
        setChat(chatData);
        
        presenceUnsubscribes.forEach((unsub) => unsub());
        presenceUnsubscribes = [];
        setOtherUserPresence(null);
        setMembersPresence({});
        
        if (chatData.type === 'direct' && user) {
          const participants = Array.isArray(chatData.participants)
            ? chatData.participants
            : Object.keys(chatData.participants || {});
          const otherUserId = participants.find((id: string) => id !== user.uid);
          if (otherUserId) {
            const userData = await getUser(otherUserId);
            if (userData) {
              setOtherUser(userData);
              const unsubscribePresence = PresenceService.watchPresence(
                otherUserId,
                (presence) => {
                  setOtherUserPresence(presence);
                }
              );
              presenceUnsubscribes.push(unsubscribePresence);
            }
          }
        }
        
        if (chatData.type === 'group' && chatData.participants) {
          const participantIds = Array.isArray(chatData.participants)
            ? chatData.participants
            : Object.keys(chatData.participants || {});
          
          const memberPromises = participantIds.map((uid: string) => getUser(uid));
          const memberData = await Promise.all(memberPromises);
          const validMembers = memberData.filter((u): u is User => u !== null);
          setMembers(validMembers);
          
          validMembers.forEach((member) => {
            if (member.uid === user?.uid) {
              setMembersPresence((prev) => ({
                ...prev,
                [member.uid]: {online: true, lastSeen: Date.now()},
              }));
            } else {
              const unsubscribe = PresenceService.watchPresence(
                member.uid,
                (presence) => {
                  setMembersPresence((prev) => ({
                    ...prev,
                    [member.uid]: presence || {online: false, lastSeen: 0},
                  }));
                }
              );
              presenceUnsubscribes.push(unsubscribe);
            }
          });
        }
        
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      presenceUnsubscribes.forEach((unsub) => unsub());
    };
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
        <View style={styles.profileHeader}>
          <Avatar
            name={otherUser.displayName || otherUser.email || otherUser.username || 'User'}
            imageUri={otherUser.photoURL}
            size={100}
          />
          <Text style={styles.profileName}>
            {otherUser.displayName || otherUser.username || 'User'}
          </Text>
          {otherUserPresence && (
            <Text style={[
              styles.statusText,
              otherUserPresence.online ? styles.statusOnline : styles.statusOffline
            ]}>
              {otherUserPresence.online ? 'Online' : 'Offline'}
            </Text>
          )}
        </View>

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

          {otherUserPresence && otherUserPresence.lastSeen > 0 && (
            <View style={styles.infoRow}>
              <Icon name="time-outline" size={20} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Last Seen</Text>
                <Text style={styles.infoValue}>
                  {TimeUtils.formatDate(otherUserPresence.lastSeen)}
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
            const memberPresence = membersPresence[member.uid];

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
                  {isCurrentUser ? (
                    <Text style={[styles.memberStatus, styles.statusOnline]}>
                      Online
                    </Text>
                  ) : memberPresence ? (
                    <Text style={[
                      styles.memberStatus,
                      memberPresence.online ? styles.statusOnline : styles.statusOffline
                    ]}>
                      {memberPresence.online ? 'Online' : 'Offline'}
                    </Text>
                  ) : null}
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
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <View style={[styles.header, {paddingTop: insets.top + verticalScale(12)}]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#1F2937" />
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
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <View style={[styles.header, {paddingTop: insets.top + verticalScale(12)}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: horizontalScale(16),
    paddingBottom: verticalScale(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: horizontalScale(8),
    marginRight: horizontalScale(8),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    ...fonts.semiBold,
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: horizontalScale(40),
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
    paddingVertical: verticalScale(32),
    paddingHorizontal: horizontalScale(16),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileName: {
    fontSize: moderateScale(24),
    ...fonts.bold,
    color: colors.text,
    marginTop: verticalScale(16),
    textAlign: 'center',
  },
  groupDescription: {
    fontSize: moderateScale(15),
    ...fonts.regular,
    color: colors.textSecondary,
    marginTop: verticalScale(10),
    textAlign: 'center',
    paddingHorizontal: horizontalScale(20),
    lineHeight: moderateScale(22),
  },
  memberCount: {
    fontSize: moderateScale(14),
    ...fonts.medium,
    color: colors.textSecondary,
    marginTop: verticalScale(6),
  },
  statusText: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    marginTop: verticalScale(4),
  },
  statusOnline: {
    color: colors.success,
  },
  statusOffline: {
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.white,
    paddingVertical: verticalScale(20),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(16),
    marginBottom: verticalScale(16),
  },
  sectionTitle: {
    fontSize: moderateScale(17),
    ...fonts.semiBold,
    color: colors.text,
    paddingHorizontal: horizontalScale(16),
    marginBottom: verticalScale(16),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(14),
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
    paddingVertical: verticalScale(14),
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
