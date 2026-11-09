CREATE TABLE "episode_reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "movie_id" TEXT NOT NULL,
    "season_number" INTEGER NOT NULL,
    "episode_number" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "review" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "spoilers" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "episode_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "episode_reviews_user_id_movie_id_season_number_episode_number_key"
ON "episode_reviews"("user_id", "movie_id", "season_number", "episode_number");

CREATE INDEX "episode_reviews_movie_id_season_number_episode_number_is_public_idx"
ON "episode_reviews"("movie_id", "season_number", "episode_number", "is_public");

ALTER TABLE "episode_reviews" ADD CONSTRAINT "episode_reviews_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "episode_reviews" ADD CONSTRAINT "episode_reviews_movie_id_fkey"
FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
