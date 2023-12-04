import { PineconeClient } from "@pinecone-database/pinecone";

const pineconeController = {};

pineconeController.init = async (req, res) => {
  try {
    const client = new PineconeClient();
    await client.init({
      apikey: "YOUR_API_KEY",
      environment: "us_east1-gcp",
    });

    const index = client.Index("example-index");

    res
      .status(200)
      .json({ message: "Pinecone client initialized successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

pineconeController.deleteVectors = async (req, res) => {
  try {
    const { ids, namespace, deleteAll } = req.body;

    const client = new PineconeClient();
    await client.init({
      apikey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
    });

    const index = client.Index("afternoonprep-pinecone-f0e38ed");

    if (deleteAll) {
      await index.delete1({
        deleteAll: true,
        namespace,
      });
    } else {
      await index.delete1({
        ids,
        namespace,
      });
    }

    res.status(200).json({ message: "Vectors deleted successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
};

export default pineconeController;
