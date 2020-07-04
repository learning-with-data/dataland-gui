import * as Blockly from "blockly/core";

const DataLandTheme = Blockly.Theme.defineTheme("dataland", {
  base: Blockly.Themes.Zelos,
  startHats: true,
  blockStyles: {
    control_blocks: {
      colourPrimary: "#FFBF00",
      colourSecondary: "#E6AC00",
      colourTertiary: "#CC9900",
    },
    operator_blocks: {
      colourPrimary: "#59C059",
      colourSecondary: "#46B946",
      colourTertiary: "#389438",
    },
    data_blocks: {
      colourPrimary: "#4B4a60",
      colourSecondary: "#454458",
      colourTertiary: "#353444",
    },
    visualization_blocks: {
      colourPrimary: "#0FBD8C",
      colourSecondary: "#0DA57A",
      colourTertiary: "#0B8E69",
    },
  },
  categoryStyles: {
    control_category: {
      colour: "#FFBF00",
    },
    operator_category: {
      colour: "#59C059",
    },
    data_category: {
      colour: "#4B4a60",
    },
    visualization_category: {
      colour: "#0FBD8C",
    },
  },
  componentStyles: {
    // https://developers.google.com/blockly/reference/js/Blockly.Theme?hl=ja#.ComponentStyle
    flyoutBackgroundColour: "#6B7E95",
    flyoutOpacity: 0.8,
    insertionMarker: "#FFFFFF",
    scrollbarColour: "#DCDCDC",
    selectedGlowColour: "#FFFFFF",
    toolboxBackgroundColour: "#566071",
    toolboxForegroundColour: "#FFFFFF",
    workspaceBackgroundColour: "#F8F1F1",
  },
});

export default DataLandTheme;
