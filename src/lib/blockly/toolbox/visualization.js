import {
  BLOCKARG_VISUALIZATION_COLOR,
  BLOCKARG_VISUALIZATION_TITLE,
} from "../constants";

const toolbox = `
    <category name="📊 Visualization" categorystyle="visualization_category" id="visualization_category">
        <block type="visualization_clear" id="visualization_clear"/>
        <block type="visualization_set_title" id="visualization_set_title">
            <value name="${BLOCKARG_VISUALIZATION_TITLE}">
            <shadow type="text">
                <field name="TEXT">My visualization</field>
            </shadow>
            </value>
        </block>
        <sep gap="32"></sep>
        <block type="visualization_set_mark" id="visualization_set_mark"/>
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
