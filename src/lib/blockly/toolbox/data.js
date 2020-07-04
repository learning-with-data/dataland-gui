const toolbox = `
    <category name="▦ Data" categorystyle="data_category" id="data_category">
        <block type="data_row_count" id="data_row_count"/>
        <block type="data_get" id="data_get">
            <value name="COLUMN">
                <shadow type="data_get_menu"/>
            </value>
        </block>
        <block type="data_select_next" id="data_select_next"/>
        <block type="data_filter" id="data_filter">
            <value name="COLUMN">
                <shadow type="data_get_menu"/>
            </value>
            <value name="STRING">
                <shadow type="text">
                    <field name="TEXT"/>
                </shadow>
            </value>
        </block>
    </category>
`;

export default toolbox;