import { NextFunction, Response } from 'express';
import { ChatService } from '../services/chat.service';
import { messageSchema } from '@enxamistas/shared';
import { AppError } from '../errors/AppError';

const chatService = new ChatService();

export class ChatController {
  async getConversations(req: any, res: Response, next: NextFunction) {
    try {
      const conversations = await chatService.getConversations(
        req.user.profile.id,
        req.query.q as string | undefined
      );
      res.status(200).json(conversations);
    } catch (error) {
      next(error);
    }
  }

  async createConversation(req: any, res: Response, next: NextFunction) {
    try {
      const { profileIds, name, isGroup } = req.body;
      if (!Array.isArray(profileIds)) {
        throw new AppError('Lista de participantes inválida.', 400, 'INVALID_PARTICIPANTS');
      }
      const conversation = await chatService.createConversation(
        req.user.profile.id,
        profileIds,
        name,
        Boolean(isGroup)
      );
      res.status(201).json(conversation);
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req: any, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const messages = await chatService.getMessages(
        req.params.conversationId,
        req.user.profile.id,
        page
      );
      res.status(200).json(messages);
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: any, res: Response, next: NextFunction) {
    try {
      const validated = messageSchema.parse(req.body);
      const message = await chatService.sendMessage(
        req.params.conversationId,
        req.user.profile.id,
        validated
      );
      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: any, res: Response, next: NextFunction) {
    try {
      const result = await chatService.markConversationAsRead(
        req.params.conversationId,
        req.user.profile.id
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
