var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Create some movies
        yield prisma.movie.create({
            data: {
                title: 'The Shawshank Redemption',
                genre: 'Drama',
            },
        });
        yield prisma.movie.create({
            data: {
                title: 'The Godfather',
                genre: 'Crime',
            },
        });
        yield prisma.movie.create({
            data: {
                title: 'The Dark Knight',
                genre: 'Action',
            },
        });
        // Create some users
        yield prisma.user.create({
            data: {
                name: 'John Doe',
                email: 'john@example.com',
            },
        });
        yield prisma.user.create({
            data: {
                name: 'Jane Doe',
                email: 'jane@example.com',
            },
        });
        // Create some ratings
        yield prisma.rating.create({
            data: {
                userId: 1,
                movieId: 1,
                rating: 5,
            },
        });
        yield prisma.rating.create({
            data: {
                userId: 1,
                movieId: 2,
                rating: 4,
            },
        });
        yield prisma.rating.create({
            data: {
                userId: 2,
                movieId: 1,
                rating: 5,
            },
        });
        yield prisma.rating.create({
            data: {
                userId: 2,
                movieId: 3,
                rating: 3,
            },
        });
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
