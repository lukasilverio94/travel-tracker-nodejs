import nodemailer from "nodemailer";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import localizedFormat from "dayjs/plugin/localizedFormat";
import dayjs from "dayjs";
import z from "zod";
import { prisma } from "../lib/prisma";
import { getMailClient } from "../lib/mail";

dayjs.extend(localizedFormat);

export async function createTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/trips",
    {
      schema: {
        body: z.object({
          destination: z.string().min(4),
          starts_at: z.coerce.date(), // convert string to datetime
          ends_at: z.coerce.date(),
          owner_name: z.string(),
          owner_email: z.string().email(),
          emails_to_invite: z.array(z.string().email()),
        }),
      },
    },
    async (request) => {
      const {
        destination,
        starts_at,
        ends_at,
        owner_name,
        owner_email,
        emails_to_invite,
      } = request.body;

      // Validate if the date is in the future, it cannot be a past date:
      if (dayjs(starts_at).isBefore(new Date())) {
        throw new Error("Invalid trip start date.");
      }

      if (dayjs(ends_at).isBefore(starts_at)) {
        throw new Error("Invalid trip end date.");
      }

      const trip = await prisma.trip.create({
        data: {
          destination,
          starts_at,
          ends_at,
          participants: {
            createMany: {
              data: [
                {
                  name: owner_name,
                  email: owner_email,
                  is_owner: true,
                  is_confirmed: true,
                },
                // map array with emails
                ...emails_to_invite.map((email) => {
                  return { email };
                }),
              ],
            },
          },
        },
      });

      //Format Start Date
      const formattedStartDate = dayjs(starts_at).format("LL");
      const formattedEndDate = dayjs(ends_at).format("LL");

      //Use getEmailClient exported function
      const mail = await getMailClient();

      // Send email
      const message = await mail.sendMail({
        from: {
          name: "Plann.er Team",
          address: "hello@plann.er",
        },
        to: {
          name: owner_name,
          address: owner_email,
        },
        subject: `Confirm your trip to ${destination} on ${formattedStartDate}`,
        html: `
            <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6">
                <p>
                    You solicited the creation of a trip to <strong>${destination}</strong>,
                    Brasil, on date of <strong>${formattedStartDate}</strong> till <strong>${formattedEndDate}</strong>
                </p>
                <p></p>
                <p>To confirm your trip, click on the link bellow:</p>
                <p></p>
                <p><a href="">Confirm Trip</a></p>
                <p></p>
                <p>In case you don't know what this email is about, please ignore it.</p>
            </div>
        `.trim(),
      });

      console.log(nodemailer.getTestMessageUrl(message));

      return {
        tripId: trip.id,
      };
    }
  );
}
