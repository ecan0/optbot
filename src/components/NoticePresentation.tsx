import {
  Check,
  Database,
  FileText,
  LayoutList,
  Route,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck
} from 'lucide-react';
import { noticeHeadline, noticeSummary, referenceNoticeSections } from '../studyContent';
import { getNoticeSlot } from '../surveyLogic';
import type { NoticeSection, NoticeSlot, NoticeSurface, NoticeVariant } from '../types';

type NoticePresentationProps = {
  variant: NoticeVariant;
  surface: NoticeSurface;
};

type NoticeIdentityIcon = 'file-text' | 'route' | 'shield';

type NoticeIdentityBadgeProps = {
  variant: NoticeVariant;
  surface: NoticeSurface;
  slot: NoticeSlot;
  icon?: NoticeIdentityIcon;
};

const sectionIcons: Record<NoticeSection['icon'], typeof Database> = {
  database: Database,
  shield: ShieldCheck,
  'user-check': UserCheck,
  trash: Trash2,
  sparkles: Sparkles,
  'file-text': FileText
};
const identityIcons: Record<NoticeIdentityIcon, typeof Database> = {
  'file-text': FileText,
  route: Route,
  shield: ShieldCheck
};


export function NoticeIdentityBadge({ variant, surface, slot, icon }: NoticeIdentityBadgeProps) {
  const VariantIcon =
    variant.id === 'icon-led-disclosure'
      ? LayoutList
      : variant.id === 'trust-cue-summary'
        ? ShieldCheck
        : Route;
  const IdentityIcon = icon ? identityIcons[icon] : VariantIcon;
  const showsIcon = icon !== undefined || surface === 'assigned';

  return (
    <span className={`notice-identity-badge notice-identity-${slot.toLowerCase()}`} aria-label={`Notice ${slot}`}>
      {showsIcon ? <IdentityIcon aria-hidden="true" size={17} /> : null}
      <strong>Notice {slot}</strong>
    </span>
  );
}

function VisualDisclosureSections({ variant }: { variant: NoticeVariant }) {
  const showControlMarker = variant.id === 'trust-cue-summary';

  return (
    <ol className="notice-a-sections" aria-label="Notice A terms">
      {referenceNoticeSections.map((section, index) => {
        const Icon = sectionIcons[section.icon];

        return (
          <li key={section.id}>
            <span className="notice-a-section-cue" aria-hidden="true">
              <span className="notice-a-section-icon">
                <Icon size={26} strokeWidth={1.7} />
                {showControlMarker ? <Check className="notice-a-control-marker" size={13} strokeWidth={2.4} /> : null}
              </span>
              <span className="notice-a-section-index">{String(index + 1).padStart(2, '0')}</span>
            </span>
            <span className="notice-a-section-copy">
              <h3>{section.label}</h3>
              <p>{section.body}</p>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function TextDisclosureSections() {
  return (
    <div className="notice-b-sections" aria-label="Notice B terms">
      {referenceNoticeSections.map((section) => (
        <section key={section.id}>
          <h3>{section.label}</h3>
          <p>{section.body}</p>
        </section>
      ))}
    </div>
  );
}

function NoticeHeading({ eyebrow, headline, summary }: { eyebrow?: string; headline: string; summary: string }) {
  return (
    <div className="notice-heading">
      {eyebrow ? <span>{eyebrow}</span> : null}
      <h2>{headline}</h2>
      <p>{summary}</p>
    </div>
  );
}

export function NoticePresentation({ variant, surface }: NoticePresentationProps) {
  const slot = getNoticeSlot(surface);
  const isReference = surface === 'reference-text';
  const treatmentClass = isReference
    ? 'reference-treatment'
    : variant.id === 'icon-led-disclosure'
      ? 'disclosure-ledger-treatment'
      : variant.id === 'trust-cue-summary'
        ? 'privacy-controls-treatment'
        : 'data-journey-treatment';

  return (
    <section
      className={`notice-presentation notice-${slot.toLowerCase()} ${treatmentClass}`}
      aria-label={`Notice ${slot}`}
    >
      <div className="notice-identity-row">
        <NoticeIdentityBadge
          icon={isReference ? 'route' : undefined}
          variant={variant}
          surface={surface}
          slot={slot}
        />
      </div>

      <div className="notice-document">
        <NoticeHeading
          eyebrow={isReference ? undefined : 'Privacy notice'}
          headline={noticeHeadline}
          summary={noticeSummary}
        />
        {isReference ? <TextDisclosureSections /> : <VisualDisclosureSections variant={variant} />}
      </div>
    </section>
  );
}
