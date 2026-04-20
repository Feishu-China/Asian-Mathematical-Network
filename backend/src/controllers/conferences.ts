import { Request, Response } from 'express';
import { requireAuthenticatedUserId } from '../lib/auth';
import { parseConferenceApplicationInput } from '../lib/conference';
import { prisma } from '../lib/prisma';
import {
  serializeConferenceApplication,
  serializeConferenceApplicationForm,
  serializeConferenceDetail,
  serializeConferenceListItem,
} from '../serializers/conference';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

const parseNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const listConferences = async (req: Request, res: Response) => {
  const page = parseNumber(req.query.page, DEFAULT_PAGE);
  const pageSize = parseNumber(req.query.page_size, DEFAULT_PAGE_SIZE);
  const status = typeof req.query.status === 'string' ? req.query.status : 'published';
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  const where = {
    status,
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { shortName: { contains: q } },
            { locationText: { contains: q } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.conference.findMany({
      where,
      orderBy: [{ applicationDeadline: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.conference.count({ where }),
  ]);

  res.status(200).json({
    data: {
      items: items.map(serializeConferenceListItem),
    },
    meta: {
      page,
      page_size: pageSize,
      total,
    },
  });
};

export const getConferenceDetail = async (req: Request, res: Response) => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const conference = await prisma.conference.findFirst({
    where: {
      slug,
      status: 'published',
    },
  });

  if (!conference) {
    res.status(404).json({ message: 'Conference not found' });
    return;
  }

  res.status(200).json({
    data: {
      conference: serializeConferenceDetail(conference),
    },
  });
};

export const getConferenceApplicationForm = async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const conference = await prisma.conference.findFirst({
    where: {
      id,
      status: 'published',
    },
  });

  if (!conference) {
    res.status(404).json({ message: 'Conference not found' });
    return;
  }

  res.status(200).json({
    data: serializeConferenceApplicationForm(conference),
  });
};

export const createConferenceApplicationDraft = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const conference = await prisma.conference.findFirst({
      where: {
        id,
        status: 'published',
      },
    });

    if (!conference) {
      res.status(404).json({ message: 'Conference not found' });
      return;
    }

    const existing = await prisma.application.findFirst({
      where: {
        conferenceId: conference.id,
        applicantUserId: userId,
        applicationType: 'conference_application',
      },
    });

    if (existing) {
      res.status(409).json({ message: 'Application already exists for this conference' });
      return;
    }

    const input = parseConferenceApplicationInput(req.body as Record<string, unknown>);
    const application = await prisma.application.create({
      data: {
        applicationType: 'conference_application',
        sourceModule: 'M2',
        conferenceId: conference.id,
        applicantUserId: userId,
        status: 'draft',
        participationType: input.participationType,
        statement: input.statement,
        abstractTitle: input.abstractTitle,
        abstractText: input.abstractText,
        interestedInTravelSupport: input.interestedInTravelSupport,
        extraAnswersJson: input.extraAnswersJson,
      },
    });

    res.status(201).json({
      data: {
        application: serializeConferenceApplication({
          ...application,
          conferenceTitle: conference.title,
        }),
      },
    });
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if ((error as Error).message === 'FILES_NOT_SUPPORTED_YET') {
      res.status(422).json({ message: 'file attachments are not available yet' });
      return;
    }

    res.status(400).json({ message: 'Invalid conference application payload' });
  }
};
