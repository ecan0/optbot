import {
  Database,
  FileText,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck
} from 'lucide-react';
import { referenceNoticeSections } from '../studyContent';
import type { NoticeBadge, NoticeSection, NoticeVariant } from '../types';

type NoticePresentationProps = {
  variant: NoticeVariant;
  surface: 'assigned' | 'reference-text';
};

const sectionIcons: Record<NoticeSection['icon'], typeof Database> = {
  database: Database,
  shield: ShieldCheck,
  'user-check': UserCheck,
  trash: Trash2,
  sparkles: Sparkles,
  'file-text': FileText
};

const badgeIcons: Record<NoticeBadge['icon'], typeof Database> = {
  lock: LockKeyhole,
  'user-check': UserCheck,
  trash: Trash2,
  'file-text': FileText,
  sparkles: Sparkles
};

function DisclosureSections({ showIcons = false }: { showIcons?: boolean }) {
  return (
    <ul className={showIcons ? 'notice-section-list notice-section-grid' : 'notice-section-list'}>
      {referenceNoticeSections.map((section) => {
        const Icon = sectionIcons[section.icon];

        return (
          <li className="notice-section-row" key={section.id}>
            {showIcons ? (
              <span className="notice-section-icon" aria-hidden="true">
                <Icon size={18} />
              </span>
            ) : null}
            <span>
              <strong>{section.label}</strong>
              <span>{section.body}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function PrivacyCommitments({ badges }: { badges: NoticeBadge[] }) {
  return (
    <ul className="privacy-commitments" aria-label="Privacy commitments">
      {badges.map((badge) => {
        const Icon = badgeIcons[badge.icon];

        return (
          <li key={badge.label}>
            <span aria-hidden="true">
              <Icon size={18} />
            </span>
            <span>
              <strong>{badge.label}</strong>
              <small>{badge.detail}</small>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function DataJourney({ variant }: { variant: NoticeVariant }) {
  return (
    <ol className="data-journey" aria-label="Data use pathway">
      {variant.flow?.map((step, index) => (
        <li key={step.label}>
          <span className="flow-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <span>
            <strong>{step.label}</strong>
            <small>{step.detail}</small>
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

export function NoticePresentation({ variant, surface }: NoticePresentationProps) {
  if (surface === 'reference-text') {
    return (
      <section className="notice-presentation reference-notice" aria-label="Reference text privacy notice">
        <NoticeHeading
          eyebrow="Standard text notice"
          headline="Example AI data sharing notice"
          summary="This text notice describes the same study intent: optional sharing of AI interactions to improve future AI systems."
        />
        <DisclosureSections />
      </section>
    );
  }

  if (variant.visualDesignVariantId === 'disclosure-ledger-v2') {
    return (
      <section className="notice-presentation disclosure-ledger" aria-label={`${variant.label} privacy notice presentation`}>
        <NoticeHeading eyebrow={variant.label} headline={variant.headline} summary={variant.summary} />
        <DisclosureSections />
      </section>
    );
  }

  if (variant.visualDesignVariantId === 'privacy-controls-v2') {
    return (
      <section className="notice-presentation privacy-controls" aria-label={`${variant.label} privacy notice presentation`}>
        <NoticeHeading eyebrow={variant.label} headline={variant.headline} summary={variant.summary} />
        {variant.badges ? <PrivacyCommitments badges={variant.badges} /> : null}
        <DisclosureSections showIcons />
      </section>
    );
  }

  return (
    <section className="notice-presentation data-journey-notice" aria-label={`${variant.label} privacy notice presentation`}>
      <NoticeHeading eyebrow={variant.label} headline={variant.headline} summary={variant.summary} />
      <DataJourney variant={variant} />
      <DisclosureSections showIcons />
    </section>
  );
}
