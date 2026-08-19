/**
 * A short, human-readable summary of a tool call's arguments, used in the
 * tool chips of the AI chat transcript and live turn.
 * @param {string} name The tool name.
 * @param {Object} args The parsed tool arguments.
 * @returns {string}
 */
const summarizeToolCall = (name, args) => {
  switch (name) {
    case "getDataColumns":
      return "looking up the data table's columns";
    case "readDataTable":
      return `reading up to ${args.num_rows || 10} rows of the data table`;
    case "getTableStats":
      return "computing statistics for the data table";
    case "getCurrentCode":
      return "reading the current Blockly code";
    case "getCurrentVisualization":
      return "reading the current visualization spec";
    default:
      return `calling ${name}`;
  }
};

export default summarizeToolCall;
