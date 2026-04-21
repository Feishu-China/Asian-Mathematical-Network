import { Request, Response } from 'express';
import { requireAuthenticatedUserId } from '../lib/auth';
import {
  parseGrantApplicationInput,
  requireEligibleLinkedConferenceApplication,
} from '../lib/grant';
import { prisma } from '../lib/prisma';
import {
  serializeGrantApplication,
  serializeGrantApplicationForm,
  serializeGrantDetail,
  serializeGrantListItem,
} from '../serializers/grant';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

const parseNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const listGrants = async (req: Request, res: Response) => {
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
            { description: { contains: q } },
            { eligibilitySummary: { contains: q } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.grantOpportunity.findMany({
      where,
      orderBy: [{ applicationDeadline: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.grantOpportunity.count({ where }),
  ]);

  res.status(200).json({
    data: {
      items: items.map(serializeGrantListItem),
    },
    meta: {
      page,
      page_size: pageSize,
      total,
    },
  });
};

export const getGrantDetail = async (req: Request, res: Response) => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const grant = await prisma.grantOpportunity.findFirst({
    where: {
      slug,
      status: 'published',
    },
  });

  if (!grant) {
    res.status(404).json({ message: 'Grant not found' });
    return;
  }

  res.status(200).json({
    data: {
      grant: serializeGrantDetail(grant),
    },
  });
};

export const getGrantApplicationForm = async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const grant = await prisma.grantOpportunity.findFirst({
    where: {
      id,
      status: 'published',
    },
  });

  if (!grant) {
    res.status(404).json({ message: 'Grant not found' });
    return;
  }

  res.status(200).json({
    data: serializeGrantApplicationForm(grant),
  });
};

export const getMyGrantApplication = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const application = await prisma.application.findFirst({
      where: {
        grantId: id,
        applicantUserId: userId,
        applicationType: 'grant_application',
      },
      include: {
        grant: true,
      },
    });

    if (!application || !application.grant) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    res.status(200).json({
      data: {
        application: serializeGrantApplication({
          ...application,
          grantTitle: application.grant.title,
        }),
      },
    });
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const createGrantApplicationDraft = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const grant = await prisma.grantOpportunity.findFirst({
      where: {
        id,
        status: 'published',
      },
    });

    if (!grant) {
      res.status(404).json({ message: 'Grant not found' });
      return;
    }

    const existing = await prisma.application.findFirst({
      where: {
        grantId: grant.id,
        applicantUserId: userId,
        applicationType: 'grant_application',
      },
    });

    if (existing) {
      res.status(409).json({ message: 'Application already exists for this grant' });
      return;
    }

    const input = parseGrantApplicationInput(req.body as Record<string, unknown>);
    await requireEligibleLinkedConferenceApplication({
      linkedConferenceApplicationId: input.linkedConferenceApplicationId,
      applicantUserId: userId,
      linkedConferenceId: grant.linkedConferenceId,
    });

    const application = await prisma.application.create({
      data: {
        applicationType: 'grant_application',
        sourceModule: 'M7',
        grantId: grant.id,
        linkedConferenceId: grant.linkedConferenceId,
        linkedConferenceApplicationId: input.linkedConferenceApplicationId,
        applicantUserId: userId,
        status: 'draft',
        statement: input.statement,
        travelPlanSummary: input.travelPlanSummary,
        fundingNeedSummary: input.fundingNeedSummary,
        extraAnswersJson: input.extraAnswersJson,
      },
    });

    res.status(201).json({
      data: {
        application: serializeGrantApplication({
          ...application,
          grantTitle: grant.title,
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

    if ((error as Error).message === 'GRANT_PREREQUISITE_REQUIRED') {
      res.status(422).json({ message: 'A submitted linked conference application is required' });
      return;
    }

    res.status(400).json({ message: 'Invalid grant application payload' });
  }
};
