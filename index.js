const express = require("express");
const bodyParser = require("body-parser");
const { WebhookClient } = require("dialogflow-fulfillment");
const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();

app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });

  async function consultarDescripcion(agent) {
    let nombre = agent.parameters.producto || "";
    nombre = nombre.trim().toLowerCase().replace(/\s+/g, "_");
    
    db.doc(`productos/${nombre}`).get().then((doc) => {
      if (doc.exists) {
        const producto = doc.data();
        agent.add(`${producto.nombre}: ${producto.descripcion || "No hay descripción disponible."}`);
      } else {
        agent.add(`No encontré información sobre "${nombre}". ¿Podés repetirlo?`);
      }
    });
  }

  const intentMap = new Map();
  intentMap.set("ConsultarDescripcion", consultarDescripcion);

  agent.handleRequest(intentMap);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
