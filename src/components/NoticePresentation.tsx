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

function NoticeSectionRow({ section }: { section: NoticeSection }) {
  const Icon = sectionIcons[section.icon];

  return (
    <li className="notice-section-row">
      <span className="notice-section-icon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <span>
        <strong>{section.label}</strong>
        <span>{section.body}</span>
      </span>
    </li>
  );
}

function TrustBadges({ badges }: { badges: NoticeBadge[] }) {
  return (
    <div className="badge-grid" aria-label="Privacy trust indicators">
      {badges.map((badge) => {
        const Icon = badgeIcons[badge.icon];
        return (
          <div className="notice-badge" key={badge.label}>
            <span aria-hidden="true">
              <Icon size={18} />
            </span>
            <strong>{badge.label}</strong>
            <small>{badge.detail}</small>
          </div>
        );
      })}
    </div>
  );
}

function TransparencyFlow({ variant }: { variant: NoticeVariant }) {
  return (
    <ol className="notice-flow" aria-label="Data transparency flow">
      {variant.flow?.map((step, index) => (
        <li key={step.label}>
          <span className="flow-index">{index + 1}</span>
          <span>
            <strong>{step.label}</strong>
            <small>{step.detail}</small>
          </span>
        </li>
      ))}
    </ol>
  );
}

function PlainNoticeCopy() {
  return (
    <div className="plain-notice-copy">
      {referenceNoticeSections.map((section) => (
        <section key={section.id}>
          <h3>{section.label}</h3>
          <p>{section.body}</p>
        </section>
      ))}
    </div>
  );
}

export function NoticePresentation({ variant, surface }: NoticePresentationProps) {
  if (surface === 'reference-text') {
    return (
      <section className="notice-presentation reference-notice" aria-label="Reference text privacy notice">
        <div className="notice-heading">
          <span className="notice-format-pill">Standard text notice</span>
          <h2>Example AI data sharing notice</h2>
          <p>
            This text notice describes the same study intent: optional sharing of AI interactions to improve future
            AI systems.
          </p>
        </div>
        <PlainNoticeCopy />
      </section>
    );
  }

  if (variant.format === 'plain_text') {
    return (
      <section
        className={`notice-presentation notice-${variant.id}`}
        aria-label={`${variant.label} privacy notice presentation`}
      >
        <div className="notice-heading">
          <span className="notice-format-pill">{variant.label}</span>
          <h2>{variant.headline}</h2>
          <p>{variant.summary}</p>
        </div>
        <PlainNoticeCopy />
      </section>
    );
  }

  return (
    <section
      className={`notice-presentation notice-${variant.id}`}
      aria-label={`${variant.label} privacy notice presentation`}
    >
      <div className="notice-heading">
        <span className="notice-format-pill">{variant.label}</span>
        <h2>{variant.headline}</h2>
        <p>{variant.summary}</p>
      </div>

      <div className="notice-preview-layout">
        <img className="notice-preview-art" src={variant.assetSrc} alt={variant.assetAlt} />
        <div className="notice-detail-stack">
          {variant.badges ? <TrustBadges badges={variant.badges} /> : null}
          {variant.flow ? <TransparencyFlow variant={variant} /> : null}
        </div>
      </div>
      <ul className="notice-section-list notice-section-grid">
        {referenceNoticeSections.map((section) => (
          <NoticeSectionRow key={section.id} section={section} />
        ))}
      </ul>
    </section>
  );
}
