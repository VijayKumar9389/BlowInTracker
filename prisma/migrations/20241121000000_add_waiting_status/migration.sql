-- Add WAITING status to JobStatus enum
ALTER TYPE "JobStatus" ADD VALUE 'WAITING' BEFORE 'READY';

-- Update default for new jobs (existing jobs keep their current status)
ALTER TABLE "Job" ALTER COLUMN "status" SET DEFAULT 'WAITING'::"JobStatus";
