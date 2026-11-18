import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { StatusIcon } from "@/components/status-icon";
import { Header } from "@/components/header";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const jobId = parseInt(id, 10);

  if (isNaN(jobId)) {
    notFound();
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { location: true },
  });

  if (!job) {
    notFound();
  }

  const bagsPerHundredSqft =
    job.sqft && job.bags ? ((job.bags / job.sqft) * 100).toFixed(1) : null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/jobs"
            className="text-sm text-muted hover:text-ink transition-colors"
          >
            ← Back to jobs
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-ink mb-1">
            {job.location.name}
          </h1>
          {job.location.area && (
            <p className="text-muted">{job.location.area}</p>
          )}
        </div>

        <div className="mb-8">
          <StatusIcon status={job.status} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
          <div className="p-6 border border-line rounded-lg">
            <div className="text-4xl font-semibold text-ink mb-1">
              {job.rValue ? `R${job.rValue}` : "—"}
            </div>
            <div className="text-sm text-muted">R-value</div>
          </div>
          <div className="p-6 border border-line rounded-lg">
            <div className="text-4xl font-semibold text-ink mb-1">
              {job.bags ?? "—"}
            </div>
            <div className="text-sm text-muted">Bags</div>
          </div>
          <div className="p-6 border border-line rounded-lg">
            <div className="text-4xl font-semibold text-ink mb-1">
              {job.sqft?.toLocaleString() ?? "—"}
            </div>
            <div className="text-sm text-muted">Sqft</div>
          </div>
          {bagsPerHundredSqft && (
            <div className="p-6 border border-line rounded-lg">
              <div className="text-4xl font-semibold text-ink mb-1">
                {bagsPerHundredSqft}
              </div>
              <div className="text-sm text-muted">Bags per 100 sqft</div>
            </div>
          )}
        </div>

        <div className="text-sm text-muted mb-8">
          <p>Created: {formatDate(job.createdAt)}</p>
          {job.completedAt && <p>Completed: {formatDate(job.completedAt)}</p>}
          <p>Updated: {formatDate(job.updatedAt)}</p>
        </div>

        <Link
          href={`/jobs/${job.id}/edit`}
          className="inline-flex items-center justify-center min-h-11 px-6 bg-ink text-white rounded-full font-medium hover:bg-ink/90 transition-opacity"
        >
          Edit job
        </Link>
      </main>
    </div>
  );
}
