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
    let productos = agent.parameters.producto;
  
    if (!productos) {
      agent.add("No entendí qué producto querés. ¿Podés repetir?");
      return;
    }
  
    // Si es string, convertí a array para iterar igual
    if (!Array.isArray(productos)) {
      productos = [productos];
    }
  
    let respuesta = "";
  
    for (const nombre of productos) {
      const doc = await db.doc(`productos/${nombre.toLowerCase()}`).get();
  
      if (doc.exists) {
        const producto = doc.data();
        respuesta += `${producto.nombre}: ${producto.descripcion || "No hay descripción disponible."}\n`;
      } else {
        respuesta += `No encontré información sobre "${nombre}". ¿Podés repetirlo?\n`;
      }
    }
  
    agent.add(respuesta.trim());
  }
  
  
  

  const intentMap = new Map();
  intentMap.set("ConsultarDescripcion", consultarDescripcion);

  agent.handleRequest(intentMap);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
