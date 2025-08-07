import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient(); 

async function main() {
  // Create some movies
  await prisma.movie.create({
    data: {
      title: 'The Shawshank Redemption',
      genre: 'Drama',
    },
  });

  await prisma.movie.create({
    data: {
      title: 'The Godfather',
      genre: 'Crime',
    },
  });

  await prisma.movie.create({
    data: {
      title: 'The Dark Knight',
      genre: 'Action',
    },
  });

  // Create some users
  await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Jane Doe',
      email: 'jane@example.com',
    },
  });

  // Create some ratings
  await prisma.rating.create({
    data: {
      userId: 1,
      movieId: 1,
      rating: 5,
    },
  });

  await prisma.rating.create({
    data: {
      userId: 1,
      movieId: 2,
      rating: 4,
    },
  });

  await prisma.rating.create({
    data: {
      userId: 2,
      movieId: 1,
      rating: 5,
    },
  });

  await prisma.rating.create({
    data: {
      userId: 2,
      movieId: 3,
      rating: 3,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });