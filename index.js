const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const port = 3000;
const secret = process.env.WEBHOOK_SECRET;

app.use(bodyParser.json());

axios.defaults.headers.common["Content-Type"] = "application/json";

const logError = (err) => {
  console.error('ERREUR:', err.message);
  if (err.response) {
    console.error('ERREUR (PORTAINER API):', err.response.data.message);
  }
};

app.post(`/${secret}`, async (req, res) => {
  const apiUrl = process.env.PORTAINER_API_URL;
  const portainerUsername = process.env.PORTAINER_USERNAME;
  const portainerPassword = process.env.PORTAINER_PASSWORD;
  const githubUsername = process.env.GITHUB_USERNAME;
  const githubPassword = process.env.GITHUB_PASSWORD;

  try {
    const portainerResponse = await axios.post(`${apiUrl}/auth`, {
      username: portainerUsername,
      password: portainerPassword,
    });
    const token = portainerResponse.data.jwt;

    const stackId = req.body.data.stackId || 0;
    const ref = req.body.ref || '';

    if (stackId && ref) {
      await axios.put(
        `${apiUrl}/stacks/${stackId}/git/redeploy?endpointId=1`,
        {
          prune: false,
          pullImage: true,
          repositoryAuthentication: true,
          repositoryUsername: githubUsername,
          repositoryPassword: githubPassword,
          repositoryReferenceName: ref,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }

    res.status(200).send("Webhook received successfully");
  } catch (err) {
    logError(err);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Webhook server is running`);
});