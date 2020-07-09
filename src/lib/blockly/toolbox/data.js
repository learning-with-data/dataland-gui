import { BLOCKARG_DATA_MATCH, BLOCKARG_DATA_SETVALUE } from "../constants";

const toolbox = `
    <category name="▦ Data" categorystyle="data_category" id="data_category">
        <block type="data_row_count" id="data_row_count"/>
        <block type="data_get" id="data_get"/>
        <block type="data_set" id="data_set">
            <value name="${BLOCKARG_DATA_SETVALUE}">
                <shadow type="text">
                    <field name="TEXT">value</field>
                </shadow>
            </value>
        </block>
        <block type="data_select_next" id="data_select_next"/>
        <block type="data_filter" id="data_filter">
            <value name="${BLOCKARG_DATA_MATCH + 0}">
                <shadow type="text">
                    <field name="TEXT">condition 1</field>
                </shadow>
            </value>
        </block>
    </category>
`;

export default toolbox;
