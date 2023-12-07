const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const port = 3000;
const secret = process.env.WEBHOOK_SECRET;

app.use(bodyParser.json());

app.post(`/${secret}`, async (req, res) => {
  const apiUrl = process.env.PORTAINER_API_URL;
  const portainerUsername = process.env.PORTAINER_USERNAME;
  const portainerPassword = process.env.PORTAINER_PASSWORD;
  const githubUsername = process.env.GITHUB_USERNAME;
  const githubPassword = process.env.GITHUB_PASSWORD;

  console.log(req.body)

  axios.post(`${apiUrl}/auth`, {
    username: portainerUsername,
    password: portainerPassword,
  }).then(({ data }) => {
    const token = data.jwt
    axios.put(
      `${apiUrl}/stacks/${req.body.stackId ?? 0}/git/redeploy?endpointId=1`,
      {
        "prune": false,
        "pullImage": true,
        "repositoryAuthentication": true,
        "repositoryUsername": githubUsername,
        "repositoryPassword": githubPassword,
        "repositoryReferenceName": `refs/heads/${req.body.branch}`,
      }, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    ).catch((err) => {
      console.error('ERREUR: ' + err.message);
      console.error('ERREUR: ' + err.response.data.message);
    });
  }).catch((err) => {
    console.error('ERREUR: ' + err.message);
    console.error('ERREUR: ' + err.response.data.message);
  });

  res.status(200).send("Webhook received successfully");
});

app.listen(port, () => {
  console.log(`Webhook server is running`);
});