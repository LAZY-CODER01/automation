import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  try {
    const newTopic = await prisma.topic.create({
      data: {
        title: `Test Topic ${Date.now()}`,
        subreddit: 'testing',
        score: 100,
        url: 'https://example.com/test',
        source: 'ping',
      },
    });

    const fetchedTopic = await prisma.topic.findUnique({
      where: { id: newTopic.id },
    });

    console.log('Successfully created and fetched a test topic:', fetchedTopic);

    res.status(200).json({
      success: true,
      message: 'Database connection and query successful!',
      topic: fetchedTopic,
    });
  } catch (error) {
    console.error('Database ping failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect to and query the database.',
      details: error.message,
    });
  }
}
