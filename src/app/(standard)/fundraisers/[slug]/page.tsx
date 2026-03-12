export default async function FundraiserPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <section>
      <h2>Viewing Fundraiser - {slug}</h2>
      <p>This page is under construction. Please check back later.</p>
    </section>
  );
}
