import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuthenticatedUserId } from '../lib/auth';
import { canPublishConference, parseConferenceInput } from '../lib/conference';
import { serializeOrganizerConference } from '../serializers/conference';

const loadOwnedConference = async (conferenceId: string, userId: string) =>
  prisma.conference.findFirst({
    where: {
      id: conferenceId,
      staff: {
        some: {
          userId,
        },
      },
    },
    include: {
      staff: true,
    },
  });

const readIdParam = (req: Request) => (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

export const createConference = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const input = parseConferenceInput(req.body as Record<string, unknown>);

    const conference = await prisma.conference.create({
      data: {
        ...input,
        status: 'draft',
        createdByUserId: userId,
        staff: {
          create: {
            userId,
            staffRole: 'owner',
          },
        },
      },
      include: {
        staff: true,
      },
    });

    res.status(201).json({
      data: {
        conference: serializeOrganizerConference(conference),
      },
    });
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    res.status(400).json({ message: 'Invalid conference payload' });
  }
};

export const getOrganizerConference = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const conference = await loadOwnedConference(readIdParam(req), userId);

    if (!conference) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    res.status(200).json({
      data: {
        conference: serializeOrganizerConference(conference),
      },
    });
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const updateConference = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const conferenceId = readIdParam(req);
    const existing = await loadOwnedConference(conferenceId, userId);

    if (!existing) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    if (existing.status === 'closed') {
      res.status(409).json({ message: 'Closed conferences cannot be edited' });
      return;
    }

    const input = parseConferenceInput(req.body as Record<string, unknown>);
    const conference = await prisma.conference.update({
      where: { id: conferenceId },
      data: input,
      include: { staff: true },
    });

    res.status(200).json({
      data: {
        conference: serializeOrganizerConference(conference),
      },
    });
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    res.status(400).json({ message: 'Invalid conference payload' });
  }
};

export const publishConference = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const conferenceId = readIdParam(req);
    const existing = await loadOwnedConference(conferenceId, userId);

    if (!existing) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    if (!canPublishConference(existing)) {
      res.status(422).json({ message: 'Conference is not ready to publish' });
      return;
    }

    const conference = await prisma.conference.update({
      where: { id: conferenceId },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
      include: { staff: true },
    });

    res.status(200).json({
      data: {
        conference: serializeOrganizerConference(conference),
      },
    });
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const closeConference = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const conferenceId = readIdParam(req);
    const existing = await loadOwnedConference(conferenceId, userId);

    if (!existing) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const conference = await prisma.conference.update({
      where: { id: conferenceId },
      data: {
        status: 'closed',
        closedAt: new Date(),
      },
      include: { staff: true },
    });

    res.status(200).json({
      data: {
        conference: serializeOrganizerConference(conference),
      },
    });
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
