import {ChatService} from '../firebase/chat.service';
import {updateChat, getDatabase, sendMessage} from '../../firebase/database';
import {GroupInfo, Chat} from '../../types/chat';
import {Message} from '../../types/message';
import {getUser} from '../../firebase/database';

export const GroupService = {
  /**
   * Create a group
   */
  createGroup: async (
    name: string,
    description: string | undefined,
    participantIds: string[],
    createdBy: string,
    photoURL?: string,
  ): Promise<Chat> => {
    const groupInfo: GroupInfo = {
      name,
      description,
      photoURL,
      createdBy,
      admins: [createdBy],
      members: participantIds,
    };

    return ChatService.createGroupChat(participantIds, groupInfo, createdBy);
  },

  /**
   * Update group info
   */
  updateGroupInfo: async (
    chatId: string,
    updates: Partial<GroupInfo>,
  ): Promise<void> => {
    const chat = await ChatService.getChat(chatId);
    if (chat && chat.groupInfo) {
      await updateChat(chatId, {
        groupInfo: {
          ...chat.groupInfo,
          ...updates,
        },
      });
    }
  },

  /**
   * Add members to group
   * Only admins/owner can add members
   */
  addMembers: async (
    chatId: string,
    memberIds: string[],
    addedBy: string, // UID of person adding members
  ): Promise<void> => {
    const chat = await ChatService.getChat(chatId);
    if (!chat || !chat.groupInfo) {
      throw new Error('Chat not found or not a group');
    }

    // Check if user has permission (owner or admin)
    const isOwner = chat.groupInfo.createdBy === addedBy;
    const isAdmin = chat.groupInfo.admins.includes(addedBy);
    if (!isOwner && !isAdmin) {
      throw new Error('Only admins and owner can add members');
    }

    // Filter out members who are already in the group
    // Handle both array and object formats
    const existingParticipants = Array.isArray(chat.participants)
      ? chat.participants
      : Object.keys(chat.participants || {});
    const newMemberIds = memberIds.filter(id => !existingParticipants.includes(id));

    if (newMemberIds.length === 0) {
      return; // All members already in group
    }

    // Convert participants array to object for Firebase (if it's not already an object)
    let currentParticipantsObj: {[uid: string]: boolean} = {};
    if (typeof chat.participants === 'object' && !Array.isArray(chat.participants)) {
      // Already an object
      currentParticipantsObj = {...chat.participants};
    } else {
      // Convert array to object
      chat.participants.forEach((uid: string) => {
        currentParticipantsObj[uid] = true;
      });
    }
    newMemberIds.forEach(uid => {
      currentParticipantsObj[uid] = true;
    });

    const updatedParticipants = [...existingParticipants, ...newMemberIds];
    const db = getDatabase();
    const updates: any = {};

    // Update chat participants
    updates[`chats/${chatId}/participants`] = currentParticipantsObj;
    updates[`chats/${chatId}/groupInfo/members`] = updatedParticipants;
    updates[`chats/${chatId}/updatedAt`] = Date.now();

    // Add chat to new members' userChats
    for (const memberId of newMemberIds) {
      updates[`userChats/${memberId}/${chatId}`] = true;
    }

    // Get addedBy user name for system message
    const addedByUser = await getUser(addedBy);
    const addedByName =
      addedByUser?.displayName || addedByUser?.email || 'Someone';

    // Get names of added users for system message
    const addedUserNames: string[] = [];
    for (const memberId of newMemberIds) {
      const memberUser = await getUser(memberId);
      const memberName =
        memberUser?.displayName || memberUser?.email || 'User';
      addedUserNames.push(memberName);
    }

    // Create system message: "X added Y, Z"
    const systemMessageText =
      addedUserNames.length === 1
        ? `${addedByName} added ${addedUserNames[0]}`
        : `${addedByName} added ${addedUserNames.join(', ')}`;

    const systemMessage: Message = {
      messageId: `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chatId,
      senderId: 'system',
      text: systemMessageText,
      timestamp: Date.now(),
      type: 'system',
      readBy: {},
      deliveredTo: [],
    };

    // Add system message
    updates[`messages/${chatId}/${systemMessage.messageId}`] = systemMessage;

    // Update last message
    updates[`chats/${chatId}/lastMessage`] = systemMessage;
    updates[`chats/${chatId}/lastMessageTime`] = systemMessage.timestamp;

    // Execute all updates atomically
    await db.ref().update(updates);
  },

  /**
   * Remove members from group
   */
  removeMembers: async (
    chatId: string,
    memberIds: string[],
  ): Promise<void> => {
    const chat = await ChatService.getChat(chatId);
    if (chat) {
      const updatedParticipants = chat.participants.filter(
        id => !memberIds.includes(id),
      );
      await updateChat(chatId, {
        participants: updatedParticipants,
      });

      if (chat.groupInfo) {
        await updateChat(chatId, {
          groupInfo: {
            ...chat.groupInfo,
            members: updatedParticipants,
            admins: chat.groupInfo.admins.filter(id => !memberIds.includes(id)),
          },
        });
      }
    }
  },

  /**
   * Add admin to group
   */
  addAdmin: async (chatId: string, adminId: string): Promise<void> => {
    const chat = await ChatService.getChat(chatId);
    if (chat && chat.groupInfo) {
      const updatedAdmins = [...new Set([...chat.groupInfo.admins, adminId])];
      await updateChat(chatId, {
        groupInfo: {
          ...chat.groupInfo,
          admins: updatedAdmins,
        },
      });
    }
  },

  /**
   * Remove admin from group
   */
  removeAdmin: async (chatId: string, adminId: string): Promise<void> => {
    const chat = await ChatService.getChat(chatId);
    if (chat && chat.groupInfo) {
      const updatedAdmins = chat.groupInfo.admins.filter(id => id !== adminId);
      await updateChat(chatId, {
        groupInfo: {
          ...chat.groupInfo,
          admins: updatedAdmins,
        },
      });
    }
  },
};

