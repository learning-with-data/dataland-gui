// Argument names for...

// control blocks
export const BLOCKARG_CONTROL_REPEAT_TIMES = "TIMES";
export const BLOCKARG_CONTROL_IF_CONDITION = "CONDITION";
export const BLOCKARG_CONTROL_WAIT_DURATION = "DURATION";

// data blocks
export const BLOCKARG_DATA_COLUMN = "COLUMN";
export const BLOCKARG_DATA_COMPARISON_OPERATOR = "COMPARISON_OPERATOR";
export const BLOCKARG_DATA_MATCH = "MATCH";

// operator blocks
export const BLOCKARG_OPERATOR_A = "A";
export const BLOCKARG_OPERATOR_B = "B";
export const BLOCKARG_OPERATOR_OP = "OP";

// variable blocks
export const BLOCKARG_VARIABLE_NAME = "VAR";
export const BLOCKARG_VARIABLE_VALUE = "VALUE";

// visualization blocks
export const BLOCKARG_VISUALIZATION_COLUMN = "COLUMN";
export const BLOCKARG_VISUALIZATION_TITLE = "TITLE";
export const BLOCKARG_VISUALIZATION_COLOR = "COLOR";

// debug blocks
export const BLOCKARG_DEBUG_MESSAGE = "MESSAGE";

// Dropdown constants
export const BLOCKDROPDOWN_ARITHMETIC_OP = [
  ["+", "add"],
  ["-", "subtract"],
  ["*", "multiply"],
  ["÷", "divide"],
];

export const BLOCKDROPDOWN_BOOLEAN = [
  ["and", "and"],
  ["or", "or"],
];

export const BLOCKDROPDOWN_COMPARISON = [
  ["=", "eq"],
  ["≠", "neq"],
  [">", "gt"],
  ["<", "lt"],
  ["≥", "gte"],
  ["≤", "lte"],
];
