import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Message } from '../types/message';
import { fetchMessages, sendMessageAPI, FetchMessagesParams, SendMessageParams } from '../services/api/messages.api';

/**
 * Hook to manage message fetching with infinite scroll
 */
export function useMessages(chatId: string) {
  return useInfiniteQuery({
    queryKey: ['messages', chatId],
    queryFn: ({ pageParam = 0 }) => fetchMessages({ pageParam, chatId }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    // Flatten pages and sort by timestamp (oldest to newest)
    // Newest messages should be at the bottom
    select: (data) => {
      // Flatten all messages from pages
      const allMessages = data.pages.flatMap((page) => page.messages || []);
      
      // Deduplicate messages by messageId (keep the first occurrence)
      const seenIds = new Set<string>();
      const uniqueMessages = allMessages.filter((msg) => {
        if (seenIds.has(msg.messageId)) {
          return false;
        }
        seenIds.add(msg.messageId);
        return true;
      });
      
      // Sort messages by timestamp (oldest first, newest last)
      const sortedMessages = uniqueMessages.sort((a, b) => a.timestamp - b.timestamp);
      
      return {
        pages: data.pages,
        pageParams: data.pageParams,
        messages: sortedMessages,
      };
    },
    enabled: !!chatId,
  });
}

/**
 * Hook to send a new message with optimistic updates
 */
export function useSendMessage(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMessageAPI,
    onMutate: async (variables: SendMessageParams) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', chatId] });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(['messages', chatId]);

      // Optimistically update with temp message
      queryClient.setQueryData(['messages', chatId], (old: any) => {
        if (!old) return old;

        const tempMessage: Message = {
          messageId: variables.tempId,
          chatId: variables.chatId,
          senderId: variables.senderId,
          text: variables.text,
          timestamp: Date.now(),
          type: 'text',
          readBy: {},
          deliveredTo: [],
          replyTo: variables.replyTo,
        };

        // Check if temp message already exists to avoid duplicates
        const firstPageMessages = old.pages?.[0]?.messages || [];
        const tempMessageExists = firstPageMessages.some(
          (msg: Message) => msg.messageId === variables.tempId
        );

        if (tempMessageExists) {
          return old; // Don't add duplicate
        }

        // Add to the END of the last page (newest messages should be at the end)
        // Since pages are ordered [oldest page, ..., newest page], add to last page
        const lastPageIndex = old.pages.length - 1;
        return {
          ...old,
          pages: old.pages.map((page: any, index: number) =>
            index === lastPageIndex
              ? { ...page, messages: [...page.messages, tempMessage] }
              : page
          ),
        };
      });

      return { previousMessages };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', chatId], context.previousMessages);
      }
    },
    onSuccess: (newMessage, variables) => {
      // Replace temp message with real one
      queryClient.setQueryData(['messages', chatId], (old: any) => {
        if (!old) return old;

        // Find and replace temp message in the last page (where newest messages are)
        const lastPageIndex = old.pages.length - 1;
        return {
          ...old,
          pages: old.pages.map((page: any, index: number) =>
            index === lastPageIndex
              ? {
                  ...page,
                  messages: page.messages.map((msg: Message) =>
                    msg.messageId === variables.tempId ? newMessage : msg
                  ),
                }
              : page
          ),
        };
      });
    },
  });
}

