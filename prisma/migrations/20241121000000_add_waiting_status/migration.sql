-- Add WAITING status to JobStatus enum
ALTER TYPE "JobStatus" ADD VALUE 'WAITING' BEFORE 'READY';
