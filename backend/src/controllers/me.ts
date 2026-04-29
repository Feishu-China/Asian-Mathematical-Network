import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { mapProfileRecord } from '../lib/profile';
import { prisma } from '../lib/prisma';
import { requireAuthenticatedUserId } from '../lib/auth';
import {
  buildApplicantProfileSnapshot,
  parseConferenceApplicationInput,
} from '../lib/conference';
import {
  parseGrantApplicationInput,
  requireEligibleLinkedConferenceApplication,
} from '../lib/grant';
import { serializeConferenceApplication } from '../serializers/conference';
import { serializeGrantApplication } from '../serializers/grant';
import { serializeMyApplicationItem } from '../serializers/applicationDashboard';
import { serializeApplicantApplicationDetail } from '../serializers/workflow';

const readApplicationId = (req: Request) =>
  Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

export const listMyApplications = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);

    const applications = await prisma.application.findMany({
      where: { applicantUserId: userId },
      include: {
        conference: { select: { id: true, slug: true, title: true } },
        grant: {
          select: {
            id: true,
            slug: true,
            title: true,
            reportRequired: true,
            linkedConference: {
              select: {
                title: true,
              },
            },
          },
        },
        decision: {
          select: {
            decisionKind: true,
            finalStatus: true,
            releaseStatus: true,
            releasedAt: true,
          },
        },
        postVisitReport: { select: { status: true } },
      },
      orderBy: [{ updatedAt: 'desc' }],
    });

    res.status(200).json({
      data: {
        items: applications.map(serializeMyApplicationItem),
      },
      meta: {
        total: applications.length,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    res.status(500).json({ message: 'Failed to load applications' });
  }
};

export const getMyApplicationDetail = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const applicationId = readApplicationId(req);

    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        applicantUserId: userId,
      },
      include: {
        conference: true,
        grant: {
          include: {
            linkedConference: true,
          },
        },
        decision: true,
        postVisitReport: true,
      },
    });

    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    res.status(200).json({
      data: {
        application: serializeApplicantApplicationDetail(application),
      },
    });
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    res.status(500).json({ message: 'Failed to load application detail' });
  }
};

const parsePostVisitReportInput = (body: Record<string, unknown>) => {
  const reportNarrative =
    typeof body.report_narrative === 'string' ? body.report_narrative.trim() : '';
  if (!reportNarrative) {
    throw new Error('REPORT_NARRATIVE_REQUIRED');
  }
  if (reportNarrative.length > 4000) {
    throw new Error('REPORT_NARRATIVE_TOO_LONG');
  }

  const attendanceConfirmed =
    typeof body.attendance_confirmed === 'boolean' ? body.attendance_confirmed : true;

  return { reportNarrative, attendanceConfirmed };
};

const serializePostVisitReport = (report: {
  id: string;
  status: string;
  reportNarrative: string;
  attendanceConfirmed: boolean;
  submittedAt: Date | null;
}) => ({
  id: report.id,
  status: report.status,
  report_narrative: report.reportNarrative,
  attendance_confirmed: report.attendanceConfirmed,
  submitted_at: report.submittedAt?.toISOString() ?? null,
});

export const submitMyPostVisitReport = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const applicationId = readApplicationId(req);

    const application = await prisma.application.findFirst({
      where: { id: applicationId, applicantUserId: userId },
      include: {
        grant: { select: { reportRequired: true } },
        decision: { select: { finalStatus: true, releaseStatus: true } },
        postVisitReport: true,
      },
    });

    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    if (application.applicationType !== 'grant_application') {
      res
        .status(422)
        .json({ message: 'Post-visit reports are only accepted for grant applications' });
      return;
    }

    if (
      !application.decision ||
      application.decision.releaseStatus !== 'released' ||
      application.decision.finalStatus !== 'accepted'
    ) {
      res
        .status(422)
        .json({ message: 'Post-visit reports require a released accepted decision' });
      return;
    }

    if (!application.grant?.reportRequired) {
      res.status(422).json({ message: 'This grant does not require a post-visit report' });
      return;
    }

    if (application.postVisitReport) {
      res.status(409).json({ message: 'A post-visit report has already been submitted' });
      return;
    }

    const input = parsePostVisitReportInput(req.body as Record<string, unknown>);
    const report = await prisma.postVisitReport.create({
      data: {
        applicationId: application.id,
        status: 'submitted',
        reportNarrative: input.reportNarrative,
        attendanceConfirmed: input.attendanceConfirmed,
      },
    });

    res.status(201).json({
      data: {
        post_visit_report: serializePostVisitReport(report),
      },
    });
  } catch (error) {
    const message = (error as Error).message;
    if (message === 'UNAUTHORIZED') {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    if (message === 'REPORT_NARRATIVE_REQUIRED') {
      res.status(422).json({ message: 'report_narrative is required' });
      return;
    }
    if (message === 'REPORT_NARRATIVE_TOO_LONG') {
      res.status(422).json({ message: 'report_narrative is too long' });
      return;
    }
    res.status(400).json({ message: 'Invalid post-visit report payload' });
  }
};

type OwnedApplicationRecord = Prisma.ApplicationGetPayload<{
  include: {
    conference: true;
    grant: true;
  };
}>;

const loadOwnedApplication = async (
  applicationId: string,
  userId: string
): Promise<OwnedApplicationRecord | null> =>
  prisma.application.findFirst({
    where: {
      id: applicationId,
      applicantUserId: userId,
    },
    include: {
      conference: true,
      grant: true,
    },
  });

export const updateMyConferenceApplicationDraft = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const existing = await loadOwnedApplication(readApplicationId(req), userId);

    if (!existing) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    if (existing.status !== 'draft') {
      res.status(409).json({ message: 'Only draft applications can be edited' });
      return;
    }

    if (existing.applicationType === 'conference_application') {
      if (!existing.conference) {
        res.status(404).json({ message: 'Application not found' });
        return;
      }

      const input = parseConferenceApplicationInput(req.body as Record<string, unknown>);
      const application = await prisma.application.update({
        where: { id: existing.id },
        data: {
          participationType: input.participationType,
          statement: input.statement,
          abstractTitle: input.abstractTitle,
          abstractText: input.abstractText,
          interestedInTravelSupport: input.interestedInTravelSupport,
          extraAnswersJson: input.extraAnswersJson,
        },
      });

      res.status(200).json({
        data: {
          application: serializeConferenceApplication({
            ...application,
            conferenceTitle: existing.conference.title,
          }),
        },
      });
      return;
    }

    if (existing.applicationType === 'grant_application' && existing.grant) {
      const input = parseGrantApplicationInput(req.body as Record<string, unknown>);
      await requireEligibleLinkedConferenceApplication({
        linkedConferenceApplicationId: input.linkedConferenceApplicationId,
        applicantUserId: userId,
        linkedConferenceId: existing.grant.linkedConferenceId,
      });

      const application = await prisma.application.update({
        where: { id: existing.id },
        data: {
          linkedConferenceId: existing.grant.linkedConferenceId,
          linkedConferenceApplicationId: input.linkedConferenceApplicationId,
          statement: input.statement,
          travelPlanSummary: input.travelPlanSummary,
          fundingNeedSummary: input.fundingNeedSummary,
          extraAnswersJson: input.extraAnswersJson,
        },
      });

      res.status(200).json({
        data: {
          application: serializeGrantApplication({
            ...application,
            grantTitle: existing.grant.title,
          }),
        },
      });
      return;
    }

    res.status(404).json({ message: 'Application not found' });
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

    res.status(400).json({ message: 'Invalid conference application payload' });
  }
};

export const submitMyConferenceApplication = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const existing = await loadOwnedApplication(readApplicationId(req), userId);

    if (!existing) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    if (existing.status !== 'draft') {
      res.status(409).json({ message: 'Only draft applications can be submitted' });
      return;
    }

    const profileRecord = await prisma.profile.findUnique({
      where: { userId },
      include: { mscCodes: true },
    });

    if (!profileRecord) {
      res.status(422).json({ message: 'Profile is required before submitting' });
      return;
    }

    const snapshot = buildApplicantProfileSnapshot(mapProfileRecord(profileRecord));
    const submittedAt = new Date();

    if (existing.applicationType === 'grant_application') {
      if (!existing.grant) {
        res.status(404).json({ message: 'Application not found' });
        return;
      }

      if (
        !existing.linkedConferenceApplicationId ||
        !existing.statement ||
        !existing.travelPlanSummary ||
        !existing.fundingNeedSummary
      ) {
        res.status(422).json({ message: 'Grant application is incomplete' });
        return;
      }

      await requireEligibleLinkedConferenceApplication({
        linkedConferenceApplicationId: existing.linkedConferenceApplicationId,
        applicantUserId: userId,
        linkedConferenceId: existing.grant.linkedConferenceId,
      });

      const application = await prisma.$transaction(async (tx) => {
        const updatedApplication = await tx.application.update({
          where: { id: existing.id },
          data: {
            status: 'submitted',
            submittedAt,
            applicantProfileSnapshotJson: JSON.stringify(snapshot),
          },
        });

        await tx.applicationStatusHistory.create({
          data: {
            applicationId: existing.id,
            fromStatus: 'draft',
            toStatus: 'submitted',
            changedByUserId: userId,
            reason: 'applicant_submit',
          },
        });

        return updatedApplication;
      });

      res.status(200).json({
        data: {
          application: serializeGrantApplication({
            ...application,
            grantTitle: existing.grant.title,
          }),
        },
      });
      return;
    }

    if (!existing.conference) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    const application = await prisma.$transaction(async (tx) => {
      const updatedApplication = await tx.application.update({
        where: { id: existing.id },
        data: {
          status: 'submitted',
          submittedAt,
          applicantProfileSnapshotJson: JSON.stringify(snapshot),
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: existing.id,
          fromStatus: 'draft',
          toStatus: 'submitted',
          changedByUserId: userId,
          reason: 'applicant_submit',
        },
      });

      return updatedApplication;
    });

    res.status(200).json({
      data: {
          application: serializeConferenceApplication({
            ...application,
            conferenceTitle: existing.conference.title,
          }),
        },
      });
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if ((error as Error).message === 'GRANT_PREREQUISITE_REQUIRED') {
      res.status(422).json({ message: 'A submitted linked conference application is required' });
      return;
    }

    res.status(400).json({ message: 'Invalid application submission' });
  }
};
