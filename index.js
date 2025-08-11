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

app.post("/webhook", (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });

  async function consultarDescripcion(agent) {
    let productos = agent.parameters.producto;

    if (!productos) {
      agent.add("No entendí qué producto querés. ¿Podés repetir?");
      return;
    }

    if (!Array.isArray(productos)) {
      productos = [productos];
    }

    let respuesta = "";

    for (const nombre of productos) {
      const doc = await db.doc(`productos/${nombre.toLowerCase()}`).get();

      if (doc.exists) {
        const producto = doc.data();
        respuesta += `${producto.nombre}: ${producto.descripcion || "No hay descripción disponible."}`;
        
        if(producto.medidas && producto.medidas.length > 0) {
            const medidasFormateadas = producto.medidas.slice(0, -1).join(", ") + " y " + producto.medidas[producto.medidas.length - 1];
            respuesta += `\nHay distintas medidas: ${medidasFormateadas}`;
        }
        if (producto.tipos && producto.tipos.length > 0) {
            const tiposFormateados = producto.tipos.slice(0, -1).join(", ") + " y " + producto.tipos[producto.tipos.length - 1];
            respuesta += `\nHay de distintos tipos: ${tiposFormateados}`;
        }
      } else {
        respuesta += `No encontré información sobre "${nombre}". ¿Podés repetirlo?\n`;
      }
    }

    agent.add(respuesta.trim());
  }

  let intentMap = new Map();
  intentMap.set("ConsultarDescripcion", consultarDescripcion);

  agent.handleRequest(intentMap);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
