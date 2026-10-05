interface DashboardHeaderProps {
  title: string;
  subtitle: string;
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  return (
    <div>
      <h1 className='text-3xl font-bold text-foreground'>{title}</h1>
      <p className='mt-1 text-muted-foreground'>{subtitle}</p>
    </div>
  );
}
