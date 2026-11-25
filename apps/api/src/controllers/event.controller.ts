import { NextFunction, Request, Response } from 'express';
import { EventService } from '../services/event.service';
import { eventSchema, eventUpdateSchema, rsvpSchema, commitmentSchema } from '@enxamistas/shared';
import { AppError } from '../errors/AppError';

const eventService = new EventService();

export class EventController {
  async create(req: any, res: Response, next: NextFunction) {
    try {
      const validatedData = eventSchema.parse(req.body);
      const event = await eventService.createEvent(req.user.profile.id, req.user.id, validatedData);
      res.status(201).json(event);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: any, res: Response, next: NextFunction) {
    try {
      const events = await eventService.getEvents(req.query, Boolean(req.user));
      res.status(200).json(events);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: any, res: Response, next: NextFunction) {
    try {
      const event = await eventService.getEventById(req.params.id, Boolean(req.user));
      if (!event) throw new AppError('Evento não encontrado', 404, 'EVENT_NOT_FOUND');
      res.status(200).json(event);
    } catch (error) {
      next(error);
    }
  }

  async update(req: any, res: Response, next: NextFunction) {
    try {
      const validated = eventUpdateSchema.parse(req.body);
      const event = await eventService.updateEvent(req.params.id, validated, req.user.id);
      res.status(200).json(event);
    } catch (error) {
      next(error);
    }
  }

  async rsvp(req: any, res: Response, next: NextFunction) {
    try {
      const { status } = rsvpSchema.parse(req.body);
      const rsvp = await eventService.rsvp(req.params.id, req.user.profile.id, status);
      res.status(200).json(rsvp);
    } catch (error) {
      next(error);
    }
  }

  async getCommitments(req: any, res: Response, next: NextFunction) {
    try {
      const commitments = await eventService.getCommitments(Boolean(req.user));
      res.status(200).json(commitments);
    } catch (error) {
      next(error);
    }
  }

  async createCommitment(req: any, res: Response, next: NextFunction) {
    try {
      const validated = commitmentSchema.parse(req.body);
      const item = await eventService.createCommitment(req.user.profile.id, req.user.id, validated);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  }

  async deleteCommitment(req: any, res: Response, next: NextFunction) {
    try {
      await eventService.deleteCommitment(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
