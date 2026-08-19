/**
 * Switch for controlling the AI Helper feature (the "AI Helper" button and the
 * chat panel it opens). Read from the VITE_AI_ENABLED env variable at build
 * time; it is OFF by default, so the feature is hidden unless explicitly
 * enabled in the build's environment (see .env.example).
 */
export const AI_ENABLED = import.meta.env.VITE_AI_ENABLED === "true";

/**
 * Configuration for the AI model API used by the AI Helper. These are read
 * at build time from the corresponding VITE_* env variables (see
 * .env.example) and fall back to sensible defaults so the app works
 * out-of-the-box against a local model server.
 *
 * Note: VITE_AI_VISION is an *independent* flag (read by AIService and
 * ToolRegistry) that controls whether the AI can see the current chart
 * image. It only has an effect when AI_ENABLED is true, but it is not
 * implied by it: vision can be enabled or disabled freely, as long as the
 * AI Helper itself is enabled for the feature to be reachable in the UI.
 */
export const AI_CONFIG = {
  baseUrl: import.meta.env.VITE_AI_API_BASE_URL || "http://localhost:13305/v1",
  model: import.meta.env.VITE_AI_MODEL_NAME || "Gemma-4-31B-it-MTP-GGUF",
  apiKey: import.meta.env.VITE_AI_API_KEY || "notneeded",
};
