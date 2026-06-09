import type {
  Message as BedrockMessage,
  SystemContentBlock,
} from '@aws-sdk/client-bedrock-runtime';
import { ChatMessage } from '@/chat/domain/entities/message';

export interface BedrockConversation {
  system: SystemContentBlock[];
  messages: BedrockMessage[];
}

/**
 * A Converse API da AWS separa o prompt de sistema (`system`) das mensagens
 * (`messages`, com `content` em blocos). Esta função traduz o nosso
 * `ChatMessage[]` para esse formato.
 */
export function toBedrockConversation(messages: ChatMessage[]): BedrockConversation {
  const system: SystemContentBlock[] = [];
  const out: BedrockMessage[] = [];

  for (const message of messages) {
    if (message.role === 'system') {
      system.push({ text: message.content });
    } else {
      out.push({ role: message.role, content: [{ text: message.content }] });
    }
  }

  return { system, messages: out };
}
