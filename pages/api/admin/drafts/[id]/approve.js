import prisma from '../../../../../lib/prisma';

export default async function handler(req, res) {
  // We only accept POST requests for this action
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id } = req.query;
  const draftId = parseInt(id, 10);

  if (isNaN(draftId)) {
    return res.status(400).json({ error: 'Invalid draft ID.' });
  }

  try {
    const approvedDraft = await prisma.draft.update({
      where: { id: draftId },
      data: {
        status: 'approved', // The core logic: change the status
      },
    });

    // Here you could enqueue a post job to Redis or another queue system
    console.log(`Draft ${approvedDraft.id} approved. Ready to be posted.`);

    res.status(200).json(approvedDraft);
  } catch (error) {
    console.error('Failed to approve draft:', error);
    res.status(500).json({ error: 'Failed to approve draft.' });
  }
}

