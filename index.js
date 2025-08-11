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
    const nombre = agent.parameters.producto;
    console.log(nombre);

    const snapshot = await db.collection("productos")
      .where("nombre", "==", nombre)
      .limit(1)
      .get();

    if (snapshot.empty) {
      agent.add(`No encontré información sobre "${nombre}". ¿Podés repetirlo?`);
      return;
    }

    const producto = snapshot.docs[0].data();
    agent.add(`${producto.nombre}: ${producto.descripcion || "No hay descripción disponible."}`);
  }

  const intentMap = new Map();
  intentMap.set("ConsultarDescripcion", consultarDescripcion);

  agent.handleRequest(intentMap);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
