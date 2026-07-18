import {
  Database,
  FileText,
  LockKeyhole,
  PanelTop,
  Route,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck
} from 'lucide-react';
import { referenceNoticeSections } from '../studyContent';
import { getNoticeSlot } from '../surveyLogic';
import type {
  NoticeTreatmentItem,
  NoticePresentationOrder,
  NoticeSection,
  NoticeSlot,
  NoticeSurface,
  NoticeVariant
} from '../types';

type NoticePresentationProps = {
  variant: NoticeVariant;
  surface: NoticeSurface;
  noticeOrder: NoticePresentationOrder;
};

type NoticeIdentityBadgeProps = {
  variant: NoticeVariant;
  surface: NoticeSurface;
  slot: NoticeSlot;
};

const sectionIcons: Record<NoticeSection['icon'], typeof Database> = {
  database: Database,
  shield: ShieldCheck,
  'user-check': UserCheck,
  trash: Trash2,
  sparkles: Sparkles,
  'file-text': FileText
};

const badgeIcons: Record<NoticeTreatmentItem['icon'], typeof Database> = {
  lock: LockKeyhole,
  'user-check': UserCheck,
  trash: Trash2
};

export function NoticeIdentityBadge({ variant, surface, slot }: NoticeIdentityBadgeProps) {
  const IdentityIcon =
    surface === 'reference-text'
      ? FileText
      : variant.id === 'plain-text-control'
        ? PanelTop
        : variant.id === 'trust-cue-summary'
          ? ShieldCheck
          : Route;

  return (
    <span className="notice-identity-badge" aria-label={`Notice ${slot}`}>
      <IdentityIcon aria-hidden="true" size={17} />
      <strong>Notice {slot}</strong>
    </span>
  );
}

function DisclosureSections() {
  return (
    <div className="notice-disclosure">
      <p className="notice-disclosure-label">Complete disclosure</p>
      <ul className="notice-section-list">
        {referenceNoticeSections.map((section) => {
          const Icon = sectionIcons[section.icon];

          return (
            <li className="notice-section-row" key={section.id}>
              <span className="notice-section-icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <span>
                <strong>{section.label}</strong>
                <span>{section.body}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PlainTreatmentSummary({ items }: { items: NoticeTreatmentItem[] }) {
  return (
    <ul className="plain-treatment-summary" aria-label="Notice summary">
      {items.map((item) => (
        <li key={item.label}>
          <strong>{item.label}</strong>
          <small>{item.detail}</small>
        </li>
      ))}
    </ul>
  );
}

function PrivacyCommitments({ items }: { items: NoticeTreatmentItem[] }) {
  return (
    <ul className="privacy-commitments" aria-label="Privacy commitments">
      {items.map((item) => {
        const Icon = badgeIcons[item.icon];

        return (
          <li key={item.label}>
            <span aria-hidden="true">
              <Icon size={18} />
            </span>
            <span>
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function DataJourney({ items }: { items: NoticeTreatmentItem[] }) {
  return (
    <ol className="data-journey" aria-label="Data use pathway">
      {items.map((item, index) => (
        <li key={item.label}>
          <span className="flow-index" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span>
            <strong>{item.label}</strong>
            <small>{item.detail}</small>
          </span>
        </li>
      ))}
    </ol>
  );
}

function NoticeHeading({ eyebrow, headline, summary }: { eyebrow: string; headline: string; summary: string }) {
  return (
    <div className="notice-heading">
      <span>{eyebrow}</span>
      <h2>{headline}</h2>
      <p>{summary}</p>
    </div>
  );
}

export function NoticePresentation({ variant, surface, noticeOrder }: NoticePresentationProps) {
  const slot = getNoticeSlot(surface, noticeOrder);
  const isReference = surface === 'reference-text';
  const treatmentClass = isReference
    ? 'reference-treatment'
    : variant.id === 'plain-text-control'
      ? 'disclosure-ledger-treatment'
      : variant.id === 'trust-cue-summary'
        ? 'privacy-controls-treatment'
        : 'data-journey-treatment';

  return (
    <section
      className="notice-presentation"
      aria-label={`Notice ${slot}: ${isReference ? 'reference text' : variant.label}`}
    >
      <div className="notice-identity-row">
        <NoticeIdentityBadge variant={variant} surface={surface} slot={slot} />
        <span>{isReference ? 'Reference text presentation' : 'Assigned visual presentation'}</span>
      </div>

      <div className={`notice-treatment ${treatmentClass}`}>
        {isReference ? (
          <NoticeHeading
            eyebrow="Standard text notice"
            headline="Example AI data sharing notice"
            summary="This text notice describes optional sharing of AI interactions to improve future AI systems."
          />
        ) : (
          <NoticeHeading eyebrow={variant.label} headline={variant.headline} summary={variant.summary} />
        )}

        {!isReference && variant.id === 'plain-text-control' ? (
          <PlainTreatmentSummary items={variant.treatmentItems} />
        ) : null}
        {!isReference && variant.id === 'trust-cue-summary' ? (
          <PrivacyCommitments items={variant.treatmentItems} />
        ) : null}
        {!isReference && variant.id === 'transparency-flow' ? (
          <DataJourney items={variant.treatmentItems} />
        ) : null}
      </div>

      <DisclosureSections />
    </section>
  );
}
