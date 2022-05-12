import { BLOCKARG_OPERATOR_A, BLOCKARG_OPERATOR_B } from "../constants";

const toolbox = `
    <category name="± Operators" categorystyle="operator_category" id="operator_category"
        tooltip="Blocks to do arithmetic and other operators.">
        <block type="operator_arithmetic" id="operator_arithmetic">
            <value name="${BLOCKARG_OPERATOR_A}">
                <shadow type="math_number">
                    <field name="NUM">10</field>
                </shadow>
            </value>
            <value name="${BLOCKARG_OPERATOR_B}">
                <shadow type="math_number">
                    <field name="NUM">10</field>
                </shadow>
            </value>
        </block>
        <block type="operator_random" id="operator_random">
        <value name="${BLOCKARG_OPERATOR_A}">
            <shadow type="math_number">
                <field name="NUM">1</field>
            </shadow>
        </value>
        <value name="${BLOCKARG_OPERATOR_B}">
            <shadow type="math_number">
                <field name="NUM">10</field>
            </shadow>
        </value>
    </block>
    <sep gap="32"></sep>
        <block type="operator_compare" id="operator_compare">
            <value name="${BLOCKARG_OPERATOR_A}">
                <shadow type="math_number">
                    <field name="NUM">10</field>
                </shadow>
            </value>
            <value name="${BLOCKARG_OPERATOR_B}">
                <shadow type="math_number">
                    <field name="NUM">20</field>
                </shadow>
            </value>
        </block>
        <block type="operator_boolean" id="operator_boolean"/>
    </category>
`;

export default toolbox;
