import instana from "@tludlow-instana-fork/collector";
instana({
  serviceName: "graphql-api-apollo",
  level: "info",
});

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";
import { GraphQLError } from "graphql";

import winston, { format } from "winston";

const addTraceFormat = format((info, opts) => {
  const span = instana.currentSpan();
  info.message = `(traceId: ${span.getTraceId()}) ${info.message}`;

  return info;
});

export const logger = winston.createLogger({
  level: "info",
  defaultMeta: { service: "graphql-api" },
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
  format: addTraceFormat(),
});

instana.setLogger(logger);

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  type Book {
    title: String
    author: String
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    info(message: String!): Boolean
    warn(message: String!): Boolean
    error(message: String!): Boolean
  }
`;

const books = [
  {
    title: "The Awakening",
    author: "Kate Chopin",
  },
  {
    title: "City of Glass",
    author: "Paul Auster",
  },
];

const resolvers = {
  Query: {
    info: (_: any, { message }: any) => {
      logger.info(message);
      return true;
    },
    warn: (_: any, { message }: any) => {
      logger.warn(message);
      throw new GraphQLError(message);
    },
    error: (_: any, { message }: any) => {
      logger.error(message);
      throw new Error(message);
    },
  },
};

interface MyContext {}

const startApp = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer<MyContext>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });
  // Ensure we wait for our server to start
  await server.start();

  app.get("/error", (req, res) => {
    res.status(500).json({ message: "testing this!!" });
  });

  app.use(
    "/",
    cors<cors.CorsRequest>(),
    bodyParser.json(),
    // expressMiddleware accepts the same arguments:
    // an Apollo Server instance and optional configuration options
    expressMiddleware(server, {
      context: async ({ req }) => ({ token: req.headers.token }),
    })
  );

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: 4000 }, resolve)
  );
  console.log(`🚀 Server ready at http://localhost:4000/`);
};

startApp();
