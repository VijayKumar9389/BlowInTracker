import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Header } from "@/components/header";
import { EditJobForm } from "./form";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditJobPage({ params }: Props) {
  const { id } = await params;
  const jobId = parseInt(id, 10);

  if (isNaN(jobId)) {
    notFound();
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { folder: true },
  });

  if (!job) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-ink mb-2">Edit: {job.name}</h1>
        <p className="text-muted mb-8">
          {job.folder.name}
          {job.folder.area && ` · ${job.folder.area}`}
        </p>
        <EditJobForm job={job} />
      </main>
    </div>
  );
}
