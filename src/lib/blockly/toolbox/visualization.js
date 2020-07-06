const toolbox = `
    <category name="📊 Visualization" categorystyle="visualization_category" id="visualization_category">
        <block type="visualization_clear" id="visualization_clear"/>
        <block type="visualization_set_title" id="visualization_set_title">
            <value name="STRING">
            <shadow type="text">
                <field name="TEXT">My awesome visualization</field>
            </shadow>
            </value>
        </block>
        <sep gap="32"></sep>
        <block type="visualization_set_x" id="visualization_set_x">
            <value name="COLUMN">
                <shadow type="visualization_get_menu"/>
            </value>
        </block>
        <block type="visualization_set_y" id="visualization_set_y">
            <value name="COLUMN">
                <shadow type="visualization_get_menu"/>
            </value>
        </block>
        <sep gap="32"></sep>
        <block type="visualization_set_color_as_static" id="visualization_set_color_as_static">
            <value name="COLOR">
                <shadow type="colour_picker"></shadow>
            </value>
        </block>
        <block type="visualization_set_color_as_var" id="visualization_set_color_as_var">
            <value name="COLUMN">
                <shadow type="visualization_get_menu"/>
            </value>
        </block>
    </category>
`;

    
export default toolbox;