import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const createUser = async (req, res) => {
  const { username, password, email } = req.body;

  try {
    const user = await prisma.user.create({
      data: {
        username,
        password,
        email,
      },
    });
    res.json({ ok: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Failed to create user' });
  }
};

export default createUser;