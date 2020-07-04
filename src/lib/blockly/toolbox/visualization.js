const toolbox = `
    <category name="📊 Visualization" categorystyle="visualization_category" id="visualization_category">
    <block type="visualization_set_color" id="visualization_set_color">
        <value name="COLOR">
        <shadow type="colour_picker"/>
        </value>
    </block>
    <block type="visualization_set_title" id="visualization_set_title">
        <value name="STRING">
        <shadow type="text">
            <field name="TEXT">My awesome visualization</field>
        </shadow>
        </value>
    </block>
    <block type="visualization_scatterplot" id="visualization_scatterplot">
        <value name="COLUMN1">
        <shadow type="visualization_get_menu"/>
        </value>
        <value name="COLUMN2">
        <shadow type="visualization_get_menu"/>
        </value>
    </block>
    <block type="visualization_clear" id="visualization_clear"/>
    </category>
`;

    
export default toolbox;