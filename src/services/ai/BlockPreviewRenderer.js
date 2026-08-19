import * as Blockly from "blockly/core";
import DataLandTheme from "../../lib/blockly/theme";

/**
 * Renders Blockly JSON into an SVG data URL for inline preview in the chat panel.
 *
 * Uses a pooled hidden rendered workspace (offscreen div) and adapts the SVG
 * extraction pattern from Blockly's dev-tools screenshot plugin.
 */
/**
 * Detects a Blockly blocks payload in an AI assistant message and classifies
 * it so the UI can choose between a preview, a placeholder, and an error.
 *
 * AI responses typically wrap the JSON in a Markdown code fence
 * (```json ... ```), often with prose before and after. This helper first
 * tries to parse the trimmed content as a raw JSON object, then falls back
 * to extracting the payload from a code fence. An unclosed fence indicates
 * the JSON is still streaming (or was cut off), which the UI renders as a
 * placeholder.
 *
 * The returned `prose` field (when the status is "ok" or "pending")
 * contains the text that appears *before* the payload (everything before
 * the fence opener, trimmed). This lets the UI render the preamble alongside
 * the block preview instead of hiding it.
 *
 * @param {string} content The raw message content.
 * @returns {{status: "ok", json: Object, prose: string}|{status: "pending", prose: string}|{status: "invalid"}|{status: "none"}}
 *   - `{ status: "ok", json, prose }`: a parseable object with a `blocks`
 *     key. `prose` is the text before the payload (may be empty).
 *   - `{ status: "pending", prose }`: a JSON fence was opened but not closed
 *     (JSON likely still streaming), or the content is JSON-like but
 *     truncated. `prose` is the text before the payload.
 *   - `{ status: "invalid"}`: valid JSON that is not a blocks payload (e.g.
 *     an array or a scalar), or a closed fence whose content is not valid JSON.
 *   - `{ status: "none"}`: plain prose with no JSON payload.
 */
export function isBlocksJson(content) {
  if (typeof content !== "string") return { status: "none" };
  const trimmed = content.trim();
  if (!trimmed) return { status: "none" };

  // Fast path: the entire content is a raw JSON value.
  const raw = parseAnyJson(trimmed);
  if (raw.valid) {
    if (isBlocksObject(raw.value)) {
      return { status: "ok", json: raw.value, prose: "" };
    }
    // Valid JSON, but not a blocks payload (e.g. an array or a scalar).
    return { status: "invalid" };
  }

  // Not valid JSON. Fall back to extracting the payload from a code fence.
  const fence = extractFencedJson(trimmed);
  if (fence) {
    const prose = trimmed.slice(0, fence.openerIndex).trim();
    if (fence.closed) {
      const parsed = parseAnyJson(fence.body);
      if (parsed.valid && isBlocksObject(parsed.value)) {
        return { status: "ok", json: parsed.value, prose };
      }
      return { status: "invalid" };
    }
    // Fence opened but not yet closed: the JSON is still streaming.
    return { status: "pending", prose };
  }

  // No fence at all. If the content already looks like JSON that is simply
  // truncated (streaming), treat it as pending rather than plain prose.
  if (looksLikeTruncatedJson(trimmed)) {
    return { status: "pending", prose: "" };
  }
  return { status: "none" };
}

/**
 * Parses a string as JSON of any valid type.
 * @param {string} text
 * @returns {{valid: boolean, value: *}} `{ valid: true, value }` when `text`
 *   is valid JSON, otherwise `{ valid: false, value: undefined }`.
 */
function parseAnyJson(text) {
  try {
    return { valid: true, value: JSON.parse(text) };
  } catch {
    return { valid: false, value: undefined };
  }
}

/**
 * Checks whether a parsed JSON value is a Blockly blocks payload.
 * @param {Object} obj
 * @returns {boolean}
 */
function isBlocksObject(obj) {
  return Boolean(obj && typeof obj === "object" && !Array.isArray(obj) && obj.blocks);
}

/**
 * Extracts the body of the first Markdown code fence in the content.
 * @param {string} content
 * @returns {{body: string, closed: boolean, openerIndex: number}|null} The
 *   fence body, whether a closing fence was found, and the index of the fence
 *   opener in the input string. Returns null if no fence opener exists.
 */
function extractFencedJson(content) {
  const opener = content.match(/```(?:json|js|javascript)?\s*\n/i);
  if (!opener) return null;
  const openerIndex = opener.index;
  const start = openerIndex + opener[0].length;
  const closerIndex = content.indexOf("```", start);
  if (closerIndex === -1) {
    return { body: content.slice(start), closed: false, openerIndex };
  }
  return {
    body: content.slice(start, closerIndex).trim(),
    closed: true,
    openerIndex,
  };
}

/**
 * Heuristic: does the text look like JSON that is still being streamed
 * (opened braces/brackets that are never closed)? Used only when there is no
 * code fence, to distinguish "JSON in flight" from ordinary prose.
 * @param {string} text
 * @returns {boolean}
 */
function looksLikeTruncatedJson(text) {
  if (!text.startsWith("{")) return false;
  let braces = 0;
  let brackets = 0;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }
    if (ch === "\"") {
      inString = true;
    } else if (ch === "{") {
      braces++;
    } else if (ch === "}") {
      braces--;
    } else if (ch === "[") {
      brackets++;
    } else if (ch === "]") {
      brackets--;
    }
  }
  return braces > 0 || brackets > 0 || inString;
}

export const BlockPreviewRenderer = {
  /**
   * The hidden container element (lazily created).
   * @type {HTMLElement|null}
   */
  _container: null,

  /**
   * The pooled hidden workspace (lazily created).
   * @type {Blockly.WorkspaceSvg|null}
   */
  _workspace: null,

  /**
   * Ensures the hidden workspace is created.
   * @param {string} [dataColumns] JSON string of dataset column names,
   *   set on the container's parent so dynamic dropdowns can read them.
   * @returns {Blockly.WorkspaceSvg} The hidden workspace.
   */
  _ensureWorkspace(dataColumns) {
    if (this._workspace && this._workspace.rendered) {
      // Update the dataset columns if they changed.
      const newColumns = dataColumns || "[]";
      if (this._container.dataset.projectdatacolumns !== newColumns) {
        this._container.dataset.projectdatacolumns = newColumns;
      }
      return this._workspace;
    }

    // Clean up a previous workspace if it exists but is disposed.
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }

    // Create the offscreen container.
    this._container = document.createElement("div");
    this._container.style.cssText =
      "position: absolute; left: -9999px; width: 600px; height: 400px;";
    document.body.appendChild(this._container);

    // Set the dataset on the container so dynamic dropdowns
    // (which read parentNode.dataset.projectdatacolumns) can find columns.
    this._container.dataset.projectdatacolumns = dataColumns || "[]";

    this._workspace = Blockly.inject(this._container, {
      toolbox: null,
      trashcan: false,
      scrollbars: true,
      zoom: { controls: false, wheel: false },
      // Use the same renderer as the main workspace (zelos) so the
      // preview matches the editor's rendering exactly.
      renderer: "zelos",
      theme: DataLandTheme,
      // Use local media assets (same as the main workspace) to avoid
      // fetching from static.blockly.com. The build copies
      // node_modules/blockly/media/* to dist/blocks-media/.
      media: "/blocks-media/node_modules/blockly/media/",
      // Disable built-in CSS injection; the main workspace's stylesheet
      // is already loaded in the document.
      css: false,
    });

    return this._workspace;
  },

  /**
   * Renders the given Blockly JSON into an SVG data URL.
   *
   * @param {Object} json Parsed Blockly JSON (compatible with
   *   Blockly.serialization.workspaces.load).
   * @param {string} [dataColumns] JSON string of dataset column names,
   *   used to populate the hidden workspace's parent dataset so dynamic
   *   dropdowns render correctly.
   * @returns {Promise<string>} SVG data URL, or empty string on failure.
   */
  async renderPreview(json, dataColumns) {
    try {
      const workspace = this._ensureWorkspace(dataColumns);

      // Clear any previous blocks.
      workspace.clear();

      // Load the new blocks. Temporarily suppress Blockly's "unavailable
      // dropdown option" warnings: the AI occasionally emits a field value
      // that isn't one of the dropdown's options (e.g. "==" instead of
      // "eq"), and Blockly falls back to the default silently. The preview is
      // best-effort and non-interactive, so those warnings are noise rather
      // than actionable errors. We only filter that specific message so any
      // other console.warn still surfaces. The `_suppressingDropdownWarn` flag
      // keeps a re-entrant renderPreview (which must not happen, but is cheap
      // to guard against) from double-wrapping console.warn.
      const originalWarn = console.warn;
      if (!this._suppressingDropdownWarn) {
        this._suppressingDropdownWarn = true;
        console.warn = (...args) => {
          if (
            typeof args[0] === "string" &&
            args[0].startsWith("Cannot set the dropdown's value")
          ) {
            return;
          }
          originalWarn(...args);
        };
      }

      try {
        Blockly.serialization.workspaces.load(json, workspace);
      } finally {
        console.warn = originalWarn;
        this._suppressingDropdownWarn = false;
      }

      // Wait for the render to complete. The renderer renders
      // asynchronously; we use a short delay to allow the render pass to
      // finish before extracting the SVG.
      await new Promise((resolve) => requestAnimationFrame(resolve));

      return this._workspaceToSvg(workspace);
    } catch (e) {
      console.warn("BlockPreviewRenderer: failed to render preview", e);
      return "";
    }
  },

  /**
   * Extracts an SVG data URL from a rendered workspace.
   *
   * Adapted from Blockly dev-tools screenshot plugin (workspaceToSvg_).
   *
   * @param {Blockly.WorkspaceSvg} workspace The rendered workspace.
   * @returns {string} SVG data URL.
   */
  _workspaceToSvg(workspace) {
    const bBox = workspace.getBlocksBoundingBox();
    const x = bBox.x || bBox.left;
    const y = bBox.y || bBox.top;
    const width = bBox.width || bBox.right - x;
    const height = bBox.height || bBox.bottom - y;

    // Guard against empty workspaces (no blocks → zero-size box).
    if (width === 0 && height === 0) {
      return "";
    }

    const blockCanvas = workspace.getCanvas();
    const blockCanvasClone = blockCanvas.cloneNode(true);
    blockCanvasClone.removeAttribute("transform");

    const svg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);

    const rendererName = workspace.options.renderer || "geras";
    const themeName = workspace.getTheme
      ? workspace.getTheme().name + "-theme"
      : "";
    svg.setAttribute("class", `blocklySvg ${rendererName}-renderer ${themeName}`);
    svg.setAttribute(
      "style",
      "background-color: transparent; " +
        workspace.getInjectionDiv().style.cssText
    );

    // Inject workspace-relevant CSS. Scan both <head> (for the common
    // Blockly stylesheet and the renderer-specific stylesheet that controls
    // font-family and text fill colors) and the injection div (for any
    // additional renderer rules).
    const styleEls = [
      ...Array.from(document.head.querySelectorAll("style")),
      ...Array.from(
        workspace.getInjectionDiv().querySelectorAll("style")
      ),
    ];
    const css = styleEls
      .filter(
        (el) =>
          el.classList.contains("blockly-renderer-style") ||
          el.id.indexOf("blockly-") === 0
      )
      .map((el) => el.innerText)
      .join("\n");
    const style = document.createElement("style");
    style.textContent = css;
    svg.appendChild(style);

    // Clone <defs> (gradients, filters, markers).
    for (const defs of workspace
      .getSvgGroup()
      .getElementsByTagName("defs")) {
      svg.appendChild(defs.cloneNode(true));
    }

    svg.appendChild(blockCanvasClone);

    const svgAsXML = new XMLSerializer().serializeToString(svg);
    const encoded = svgAsXML.replace(/&nbsp/g, "&#160");

    return "data:image/svg+xml," + encodeURIComponent(encoded);
  },
};
