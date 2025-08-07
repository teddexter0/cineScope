const updateUserProfile = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { name, email },
    });

    res.json({ ok: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Failed to update user profile' });
  }
};