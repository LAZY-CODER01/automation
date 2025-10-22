import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;

  const draftId = parseInt(id, 10);
  if (isNaN(draftId)) {
    return res.status(400).json({ error: 'Invalid draft ID.' });
  }

  if (req.method === 'GET') {
    try {
      const draft = await prisma.draft.findUnique({
        where: { id: draftId },
      });

      if (!draft) {
        return res.status(404).json({ error: 'Draft not found.' });
      }

      res.status(200).json(draft);
    } catch (error) {
      console.error('Failed to fetch draft:', error);
      res.status(500).json({ error: 'Failed to fetch draft from the database.' });
    }
  } else if (req.method === 'POST') {
    try {
      const { title, summary, body, imagePrompt } = req.body;

      if (!title || !summary || !body) {
        return res.status(400).json({ error: 'Title, summary, and body are required.' });
      }

      const updatedDraft = await prisma.draft.update({
        where: { id: draftId },
        data: {
          title,
          summary,
          body,
          imagePrompt,
        },
      });

      res.status(200).json(updatedDraft);
    } catch (error) {
      console.error('Failed to update draft:', error);
      res.status(500).json({ error: 'Failed to update draft in the database.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

