export default function SectionHeader({ tag, title, subtitle, center = false, light = false }) {
  return (
    <div className={center ? 'text-center' : ''}>
      {tag && (
        <div className={`section-tag ${center ? 'justify-center' : ''} ${light ? 'text-accent' : 'text-accent'}`}>
          <span className="w-5 h-0.5 bg-accent" />
          {tag}
        </div>
      )}
      <h2 className={`section-title ${light ? 'text-white' : 'text-neutral-900'}`}>{title}</h2>
      {subtitle && (
        <p className={`section-sub ${center ? 'mx-auto' : ''} ${light ? 'text-white/60' : 'text-neutral-500'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
