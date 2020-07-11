import pako from "pako";

function createProjectBlob(code, data) {
  return pako.deflate(
    JSON.stringify({
      code: code,
      data: data,
      blob_generated_timestamp: Date.now(),
    })
  );
}

function loadProjectBlob(blob) {
  var inflated = pako.inflate(blob, { to: "string" });
  var parsed = JSON.parse(inflated);

  return [parsed.code, parsed.data];
}

export { createProjectBlob, loadProjectBlob };
