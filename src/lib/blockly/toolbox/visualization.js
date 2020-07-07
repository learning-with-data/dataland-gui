import {
  BLOCKARG_VISUALIZATION_COLOR,
} from "../constants";

const toolbox = `
    <category name="📊 Visualization" categorystyle="visualization_category" id="visualization_category">
        <block type="visualization_clear" id="visualization_clear"/>
        <block type="visualization_set_title" id="visualization_set_title"/>
        <sep gap="32"></sep>
        <block type="visualization_set_x" id="visualization_set_x"/>
        <block type="visualization_set_y" id="visualization_set_y"/>
        <sep gap="32"></sep>
        <block type="visualization_set_color_as_static" id="visualization_set_color_as_static">
            <value name="${BLOCKARG_VISUALIZATION_COLOR}">
                <shadow type="colour_picker"></shadow>
            </value>
        </block>
        <block type="visualization_set_color_as_var" id="visualization_set_color_as_var"/>
    </category>
`;

export default toolbox;
