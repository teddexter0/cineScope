import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: newPassword },
    });

    res.json({ ok: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Failed to reset password' });
  }
};

export default resetPassword;