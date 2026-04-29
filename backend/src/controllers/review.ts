import { Prisma, ReviewAssignment } from '@prisma/client';
import { Request, Response } from 'express';
import { requireAuthenticatedUserId } from '../lib/auth';
import {
  getDecisionKind,
  parseDecisionInput,
  parseReviewAssignmentInput,
  parseReviewInput,
} from '../lib/workflow';
import { hasAnyUserRole } from '../lib/userRoles';
import { prisma } from '../lib/prisma';
import {
  serializeInternalDecision,
  serializeOrganizerApplicationDetail,
  serializeOrganizerApplicationListItem,
  serializeReview,
  serializeReviewAssignment,
  serializeReviewerAssignmentDetail,
  serializeReviewerAssignmentListItem,
  serializeReviewerCandidate,
} from '../serializers/workflow';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

const parseNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const readParam = (req: Request, key: string) => {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
};

type ManagedApplicationRecord = Prisma.ApplicationGetPayload<{
  include: {
    applicant: {
      include: {
        profile: true;
      };
    };
    conference: true;
    grant: {
      include: {
        linkedConference: true;
      };
    };
    decision: true;
    reviewAssignments: {
      include: {
        review: true;
        reviewer: {
          include: {
            profile: true;
          };
        };
      };
    };
  };
}>;

const isConferenceManager = async (conferenceId: string, userId: string) => {
  if (await hasAnyUserRole(userId, ['admin'])) {
    return true;
  }

  const membership = await prisma.conferenceStaff.findFirst({
    where: {
      conferenceId,
      userId,
      staffRole: { in: ['owner', 'organizer'] },
    },
  });

  return Boolean(membership);
};

const hasReviewerWorkspaceAccess = async (userId: string) =>
  hasAnyUserRole(userId, ['reviewer', 'admin']);

const canManageApplication = async (
  application: Pick<ManagedApplicationRecord, 'applicationType' | 'conferenceId' | 'linkedConferenceId'>,
  userId: string
) => {
  if (await hasAnyUserRole(userId, ['admin'])) {
    return true;
  }

  if (application.applicationType === 'conference_application' && application.conferenceId) {
    return isConferenceManager(application.conferenceId, userId);
  }

  if (application.applicationType === 'grant_application' && application.linkedConferenceId) {
    return isConferenceManager(application.linkedConferenceId, userId);
  }

  return false;
};

const loadManagedApplication = async (
  applicationId: string,
  userId: string
): Promise<ManagedApplicationRecord | null> => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      applicant: {
        include: {
          profile: true,
        },
      },
      conference: true,
      grant: {
        include: {
          linkedConference: true,
        },
      },
      decision: true,
      reviewAssignments: {
        include: {
          review: true,
          reviewer: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: [{ assignedAt: 'desc' }],
      },
    },
  });

  if (!application) {
    return null;
  }

  return (await canManageApplication(application, userId)) ? application : null;
};

type ReviewerAssignmentRecord = Prisma.ReviewAssignmentGetPayload<{
  include: {
    application: {
      include: {
        applicant: {
          include: {
            profile: true;
          };
        };
        conference: true;
        grant: true;
      };
    };
    review: true;
  };
}>;

const loadReviewerAssignment = async (
  assignmentId: string,
  userId: string
): Promise<ReviewerAssignmentRecord | null> => {
  const assignment = await prisma.reviewAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      application: {
        include: {
          applicant: {
            include: {
              profile: true,
            },
          },
          conference: true,
          grant: true,
        },
      },
      review: true,
    },
  });

  if (!assignment) {
    return null;
  }

  if (assignment.reviewerUserId === userId || (await hasAnyUserRole(userId, ['admin']))) {
    return assignment;
  }

  return null;
};

const readApplicationStatusAfterAssignment = (
  previousStatus: string,
  assignments: ReviewAssignment[]
) => {
  if (previousStatus === 'submitted') {
    return 'under_review';
  }

  if (previousStatus === 'under_review') {
    return 'under_review';
  }

  const hasActiveAssignments = assignments.some((item) => item.status !== 'cancelled');
  return hasActiveAssignments ? 'under_review' : previousStatus;
};

export const listOrganizerConferenceApplications = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const conferenceId = readParam(req, 'id');

    const conference = await prisma.conference.findUnique({
      where: { id: conferenceId },
      select: { id: true },
    });

    if (!conference) {
      res.status(404).json({ message: 'Conference not found' });
      return;
    }

    if (!(await isConferenceManager(conferenceId, userId))) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const page = parseNumber(req.query.page, DEFAULT_PAGE);
    const pageSize = parseNumber(req.query.page_size, DEFAULT_PAGE_SIZE);
    const status = typeof req.query.status === 'string' ? req.query.status : null;

    const where = {
      conferenceId,
      applicationType: 'conference_application',
      ...(status ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          applicant: {
            include: {
              profile: true,
            },
          },
          reviewAssignments: {
            select: {
              status: true,
            },
          },
          decision: {
            select: {
              releaseStatus: true,
            },
          },
        },
        orderBy: [{ submittedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.application.count({ where }),
    ]);

    res.status(200).json({
      data: {
        items: items.map(serializeOrganizerApplicationListItem),
      },
      meta: {
        page,
        page_size: pageSize,
        total,
      },
    });
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const getOrganizerApplicationDetail = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const application = await loadManagedApplication(readParam(req, 'id'), userId);

    if (!application) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    res.status(200).json({
      data: {
        application: serializeOrganizerApplicationDetail(application),
      },
    });
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const listReviewerCandidates = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const application = await loadManagedApplication(readParam(req, 'id'), userId);

    if (!application) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const page = parseNumber(req.query.page, DEFAULT_PAGE);
    const pageSize = parseNumber(req.query.page_size, DEFAULT_PAGE_SIZE);
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const where = {
      userId: {
        not: application.applicantUserId,
      },
      user: {
        userRoles: {
          some: {
            role: { in: ['reviewer', 'admin'] },
          },
        },
      },
      ...(q
        ? {
            OR: [
              { fullName: { contains: q } },
              { institutionNameRaw: { contains: q } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        include: {
          mscCodes: true,
        },
        orderBy: [{ fullName: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.profile.count({ where }),
    ]);

    res.status(200).json({
      data: {
        items: items.map(serializeReviewerCandidate),
      },
      meta: {
        page,
        page_size: pageSize,
        total,
      },
    });
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const assignReviewer = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const application = await loadManagedApplication(readParam(req, 'id'), userId);

    if (!application) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    if (!['submitted', 'under_review'].includes(application.status)) {
      res.status(422).json({ message: 'Only submitted or under-review applications can be assigned' });
      return;
    }

    const input = parseReviewAssignmentInput(req.body as Record<string, unknown>);

    if (input.reviewerUserId === application.applicantUserId) {
      res.status(422).json({ message: 'Applicant cannot review their own application' });
      return;
    }

    const reviewerProfile = await prisma.profile.findUnique({
      where: { userId: input.reviewerUserId },
    });
    const reviewerHasRole = await hasAnyUserRole(input.reviewerUserId, ['reviewer', 'admin']);

    if (!reviewerProfile || !reviewerHasRole) {
      res.status(422).json({ message: 'Reviewer must have a reviewer role and profile record' });
      return;
    }

    const existingActiveAssignment = await prisma.reviewAssignment.findFirst({
      where: {
        applicationId: application.id,
        reviewerUserId: input.reviewerUserId,
        status: { not: 'cancelled' },
      },
    });

    if (existingActiveAssignment) {
      res.status(409).json({ message: 'Reviewer is already assigned to this application' });
      return;
    }

    const now = new Date();

    const { assignment, nextApplicationStatus } = await prisma.$transaction(async (tx) => {
      const createdAssignment = await tx.reviewAssignment.create({
        data: {
          applicationId: application.id,
          reviewerUserId: input.reviewerUserId,
          assignedByUserId: userId,
          status: 'assigned',
          conflictState: input.conflictState,
          conflictNote: input.conflictNote,
          dueAt: input.dueAt,
        },
      });

      const nextStatus = application.status === 'submitted' ? 'under_review' : application.status;

      if (nextStatus !== application.status) {
        await tx.application.update({
          where: { id: application.id },
          data: {
            status: nextStatus,
            updatedAt: now,
          },
        });

        await tx.applicationStatusHistory.create({
          data: {
            applicationId: application.id,
            fromStatus: application.status,
            toStatus: nextStatus,
            changedByUserId: userId,
            reason: 'review_assignment_created',
          },
        });
      }

      return {
        assignment: createdAssignment,
        nextApplicationStatus: nextStatus,
      };
    });

    res.status(200).json({
      data: {
        assignment: serializeReviewAssignment(assignment, application.applicationType),
        application_status: nextApplicationStatus,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    res.status(400).json({ message: 'Invalid reviewer assignment payload' });
  }
};

export const upsertDecision = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const application = await loadManagedApplication(readParam(req, 'id'), userId);

    if (!application) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    if (!['submitted', 'under_review', 'decided'].includes(application.status)) {
      res.status(422).json({ message: 'Application is not in a decision-ready state' });
      return;
    }

    if (application.decision?.releaseStatus === 'released') {
      res.status(409).json({ message: 'Released decisions cannot be overwritten' });
      return;
    }

    const input = parseDecisionInput(req.body as Record<string, unknown>);
    const decidedAt = new Date();
    const decisionKind = getDecisionKind(application.applicationType);

    const { decision } = await prisma.$transaction(async (tx) => {
      const nextDecision = await tx.decision.upsert({
        where: {
          applicationId: application.id,
        },
        update: {
          decisionKind,
          finalStatus: input.finalStatus,
          noteInternal: input.noteInternal,
          noteExternal: input.noteExternal,
          releaseStatus: 'unreleased',
          decidedByUserId: userId,
          decidedAt,
          releasedAt: null,
        },
        create: {
          applicationId: application.id,
          decisionKind,
          finalStatus: input.finalStatus,
          releaseStatus: 'unreleased',
          noteInternal: input.noteInternal,
          noteExternal: input.noteExternal,
          decidedByUserId: userId,
          decidedAt,
        },
      });

      if (application.status !== 'decided') {
        await tx.application.update({
          where: { id: application.id },
          data: {
            status: 'decided',
            decidedAt,
          },
        });

        await tx.applicationStatusHistory.create({
          data: {
            applicationId: application.id,
            fromStatus: application.status,
            toStatus: 'decided',
            changedByUserId: userId,
            reason: 'internal_decision_recorded',
          },
        });
      } else {
        await tx.application.update({
          where: { id: application.id },
          data: {
            decidedAt,
          },
        });
      }

      return {
        decision: nextDecision,
      };
    });

    res.status(200).json({
      data: {
        decision: serializeInternalDecision(decision, application.applicationType),
        application_status: 'decided',
        decided_at: decidedAt.toISOString(),
      },
    });
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    res.status(400).json({ message: 'Invalid decision payload' });
  }
};

export const releaseDecision = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const application = await loadManagedApplication(readParam(req, 'id'), userId);

    if (!application) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    if (!application.decision) {
      res.status(422).json({ message: 'Internal decision is required before release' });
      return;
    }

    if (application.decision.releaseStatus === 'released') {
      res.status(409).json({ message: 'Decision has already been released' });
      return;
    }

    if (
      application.applicationType === 'grant_application' &&
      application.linkedConferenceApplicationId &&
      ['accepted', 'waitlisted'].includes(application.decision.finalStatus)
    ) {
      const linkedConferenceDecision = await prisma.decision.findFirst({
        where: {
          applicationId: application.linkedConferenceApplicationId,
        },
      });

      if (linkedConferenceDecision?.finalStatus === 'rejected') {
        res.status(422).json({ message: 'Grant decision cannot be released after conference rejection' });
        return;
      }
    }

    const releasedAt = new Date();
    const decision = await prisma.decision.update({
      where: { applicationId: application.id },
      data: {
        releaseStatus: 'released',
        releasedAt,
      },
    });

    res.status(200).json({
      data: {
        decision: serializeInternalDecision(decision, application.applicationType),
      },
    });
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const listReviewerAssignments = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const status = typeof req.query.status === 'string' ? req.query.status : null;

    if (!(await hasReviewerWorkspaceAccess(userId))) {
      res.status(403).json({ message: 'Reviewer role required' });
      return;
    }

    const assignments = await prisma.reviewAssignment.findMany({
      where: {
        reviewerUserId: userId,
        ...(status ? { status } : {}),
      },
      include: {
        application: {
          include: {
            applicant: {
              include: {
                profile: true,
              },
            },
            conference: true,
            grant: true,
          },
        },
      },
      orderBy: [{ assignedAt: 'desc' }],
    });

    res.status(200).json({
      data: {
        items: assignments.map(serializeReviewerAssignmentListItem),
      },
    });
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const getReviewerAssignmentDetail = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);

    if (!(await hasReviewerWorkspaceAccess(userId))) {
      res.status(403).json({ message: 'Reviewer role required' });
      return;
    }

    const assignment = await loadReviewerAssignment(readParam(req, 'id'), userId);

    if (!assignment) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    res.status(200).json({
      data: {
        assignment: serializeReviewerAssignmentDetail(assignment),
      },
    });
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const submitReview = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);

    if (!(await hasReviewerWorkspaceAccess(userId))) {
      res.status(403).json({ message: 'Reviewer role required' });
      return;
    }

    const assignment = await loadReviewerAssignment(readParam(req, 'id'), userId);

    if (!assignment) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    if (assignment.status !== 'assigned') {
      res.status(422).json({ message: 'Only assigned review tasks can be submitted' });
      return;
    }

    if (assignment.conflictState === 'flagged') {
      res.status(422).json({ message: 'Conflict-flagged assignments cannot submit reviews' });
      return;
    }

    if (assignment.review) {
      res.status(409).json({ message: 'Review already submitted for this assignment' });
      return;
    }

    const input = parseReviewInput(req.body as Record<string, unknown>);
    const submittedAt = new Date();

    const review = await prisma.$transaction(async (tx) => {
      const createdReview = await tx.review.create({
        data: {
          assignmentId: assignment.id,
          score: input.score,
          recommendation: input.recommendation,
          comment: input.comment,
          submittedAt,
        },
      });

      await tx.reviewAssignment.update({
        where: { id: assignment.id },
        data: {
          status: 'review_submitted',
          completedAt: submittedAt,
        },
      });

      return createdReview;
    });

    res.status(200).json({
      data: {
        review: serializeReview(review),
      },
    });
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    res.status(400).json({ message: 'Invalid review payload' });
  }
};

