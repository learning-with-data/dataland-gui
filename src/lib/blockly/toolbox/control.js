const toolbox = `
    <category name="⚙ Control" categorystyle="control_category" id="control_category">
    <block type="event_onprojectstart" id="event_onprojectstart"/>
    <block type="control_repeat" id="control_repeat">
        <value name="TIMES">
        <shadow type="math_number">
            <field name="NUM">10</field>
        </shadow>
        </value>
    </block>
    <block type="control_if" id="control_if"/>
    <block type="control_if_else" id="control_if_else"/>
    <block type="control_wait" id="control_wait">
        <value name="DURATION">
        <shadow type="math_number">
            <field name="NUM">1</field>
        </shadow>
        </value>
    </block>
    </category>
`;

export default toolbox;