const toolbox = `
    <category name="± Operators" categorystyle="operator_category" id="operator_category">
        <block type="operator_arithmetic" id="operator_arithmetic">
            <value name="A">
                <shadow type="math_number">
                    <field name="NUM">10</field>
                </shadow>
            </value>
            <value name="OP"><shadow type="operator_arithmeticops_menu" /></value>
            <value name="B">
                <shadow type="math_number">
                    <field name="NUM">10</field>
                </shadow>
            </value>
        </block>
        <block type="operator_random" id="operator_random">
        <value name="A">
            <shadow type="math_number">
                <field name="NUM">1</field>
            </shadow>
        </value>
        <value name="B">
            <shadow type="math_number">
                <field name="NUM">10</field>
            </shadow>
        </value>
    </block>
    <sep gap="32"></sep>
        <block type="operator_compare" id="operator_compare">
            <value name="A">
                <shadow type="math_number">
                    <field name="NUM">10</field>
                </shadow>
            </value>
            <value name="OP"><shadow type="operator_compare_menu" /></value>
            <value name="B">
                <shadow type="math_number">
                    <field name="NUM">20</field>
                </shadow>
            </value>
        </block>
        <block type="operator_boolean" id="operator_boolean">
            <value name="OP"><shadow type="operator_boolean_menu" /></value>
        </block>
    </category>
`;

export default toolbox;
