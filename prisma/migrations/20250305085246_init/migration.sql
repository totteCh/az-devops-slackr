-- CreateTable
CREATE TABLE "pipelines" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pull_requests" (
    "id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "repository_name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "is_draft" BOOLEAN NOT NULL,
    "test_pipeline_id" INTEGER,

    CONSTRAINT "pull_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slack_id" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "slack_threads" (
    "ts" TEXT NOT NULL,
    "pull_request_id" INTEGER NOT NULL,

    CONSTRAINT "slack_threads_pkey" PRIMARY KEY ("ts")
);

-- CreateIndex
CREATE UNIQUE INDEX "slack_threads_pull_request_id_key" ON "slack_threads"("pull_request_id");

-- AddForeignKey
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_test_pipeline_id_fkey" FOREIGN KEY ("test_pipeline_id") REFERENCES "pipelines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slack_threads" ADD CONSTRAINT "slack_threads_pull_request_id_fkey" FOREIGN KEY ("pull_request_id") REFERENCES "pull_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
