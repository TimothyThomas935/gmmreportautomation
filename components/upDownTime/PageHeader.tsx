// components/upDownTime/PageHeader.tsx
type Props = { title: string; subtitle?: string };

export default function PageHeader({ title, subtitle }: Props) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle ? (
        <p className="text-sm text-gray-600">{subtitle}</p>
      ) : null}
    </header>
  );
}
