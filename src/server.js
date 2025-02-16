import fastify from "fastify";
import { prisma } from "./lib/prisma"

import {createTrip} from "./routes/create-trip";
import { validatorCompiler, serializerCompiler } from "fastify-type-provider-zod";


const app = fastify();

// Add schema validator and serializer
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(createTrip)

app.listen({ port:3333 }).then(() => {
    console.log("Server running")
})