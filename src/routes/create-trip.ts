import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import dayjs from "dayjs";
import z from "zod";
import { prisma } from "../lib/prisma";

export async function createTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/trips",
    {
      schema: {
        body: z.object({
          destination: z.string().min(4),
          starts_at: z.coerce.date(), // convert string to datetime
          ends_at: z.coerce.date(),
        }),
      },
    },
    async (request) => {
      const { destination, starts_at, ends_at } = request.body;

      // Validar se a data eh somente futura, nao pode ser data que ja passou:
      if (dayjs(starts_at).isBefore(new Date())) {
        throw new Error("Invalid trip start date!");
      }

      const trip = await prisma.trip.create({
        data: {
          destination,
          starts_at,
          ends_at,
        },
      });

      return {
        tripId: trip.id,
      };
    }
  );
}
