import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  // Ensure we are only handling GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Fetch all drafts from the database, ordering by the newest first
    const drafts = await prisma.draft.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Send the fetched drafts as a JSON response
    res.status(200).json(drafts);
  } catch (error) {
    console.error('Failed to fetch drafts:', error);
    // Send a generic error message to the client
    res.status(500).json({ error: 'Failed to fetch drafts from the database.' });
  }
}

