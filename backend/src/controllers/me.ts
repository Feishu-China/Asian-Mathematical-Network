import { Request, Response } from 'express';
import { mapProfileRecord } from '../lib/profile';
import { prisma } from '../lib/prisma';
import { requireAuthenticatedUserId } from '../lib/auth';
import {
  buildApplicantProfileSnapshot,
  parseConferenceApplicationInput,
} from '../lib/conference';
import { serializeConferenceApplication } from '../serializers/conference';

const readApplicationId = (req: Request) =>
  Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

const loadOwnedConferenceApplication = async (applicationId: string, userId: string) =>
  prisma.application.findFirst({
    where: {
      id: applicationId,
      applicantUserId: userId,
      applicationType: 'conference_application',
    },
    include: {
      conference: true,
    },
  });

export const updateMyConferenceApplicationDraft = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const existing = await loadOwnedConferenceApplication(readApplicationId(req), userId);

    if (!existing || !existing.conference) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    if (existing.status !== 'draft') {
      res.status(409).json({ message: 'Only draft applications can be edited' });
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
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    res.status(400).json({ message: 'Invalid conference application payload' });
  }
};

export const submitMyConferenceApplication = async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const existing = await loadOwnedConferenceApplication(readApplicationId(req), userId);

    if (!existing || !existing.conference) {
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
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
