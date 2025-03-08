import bodyParser from "body-parser";
import express from "express";
import { BASE_NODE_PORT } from "../config";
import { Value } from "../types";

type NodeState = {
  killed: boolean; // this is used to know if the node was stopped by the /stop route. It's important for the unit tests but not very relevant for the Ben-Or implementation
  x: 0 | 1 | "?" | null; // the current consensus value
  decided: boolean | null; // used to know if the node reached finality
  k: number | null; // current step of the node
};

export async function node(
  nodeId: number, // the ID of the node
  N: number, // total number of nodes in the network
  F: number, // number of faulty nodes in the network
  initialValue: Value, // initial value of the node
  isFaulty: boolean, // true if the node is faulty, false otherwise
  nodesAreReady: () => boolean, // used to know if all nodes are ready to receive requests
  setNodeIsReady: (index: number) => void // this should be called when the node is started and ready to receive requests
) {
  const node = express();
  node.use(express.json());
  node.use(bodyParser.json());

  let nodeState: NodeState = {
    killed: false,
    x: isFaulty ? null : initialValue,
    decided: null,
    k: null
  };

  // this route allows retrieving the current status of the node
  node.get("/status", (req, res) => {
    if (isFaulty) {
      res.status(500).send("faulty");
    } else {
      res.status(200).send("live");
    }
  });

  // this route allows the node to receive messages from other nodes
  node.post("/message", (req, res) => {
    const message = req.body;
    // Process the message
    console.log(`Node ${nodeId} received message:`, message);
    res.status(200).send("Message received");
  });

  // this route is used to start the consensus algorithm
  node.get("/start", async (req, res) => {
    // Start the consensus algorithm
    console.log(`Node ${nodeId} starting consensus algorithm`);
    res.status(200).send("Consensus algorithm started");
  });

  // this route is used to stop the consensus algorithm
  node.get("/stop", async (req, res) => {
    // Stop the consensus algorithm
    console.log(`Node ${nodeId} stopping consensus algorithm`);
    nodeState.killed = true;
    res.status(200).send("Consensus algorithm stopped");
  });

  // get the current state of a node
  node.get("/getState", (req, res) => {
    // Retrieve the current state of the node
    res.json(nodeState);
  });

  // start the server
  const server = node.listen(BASE_NODE_PORT + nodeId, async () => {
    console.log(
      `Node ${nodeId} is listening on port ${BASE_NODE_PORT + nodeId}`
    );

    // the node is ready
    setNodeIsReady(nodeId);
  });

  return server;
}
