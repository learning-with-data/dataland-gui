import { BLOCKARG_DEBUG_MESSAGE } from "../constants";

const toolbox = `
    <category name="🦟 DEBUG" id="debug_category">
    <block type="debug_log" id="debug_log">
        <value name="${BLOCKARG_DEBUG_MESSAGE}">
        <shadow type="text">
            <field name="TEXT">Hello DataLand!</field>
        </shadow>
        </value>
    </block>
    </category>
`;

export default toolbox;