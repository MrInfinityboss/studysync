import "dotenv/config";
import { createStudySyncApp } from "../server/app";

/** Vercel serverless entrypoint for all StudySync API and OAuth routes. */
const app = createStudySyncApp();

export default app;
