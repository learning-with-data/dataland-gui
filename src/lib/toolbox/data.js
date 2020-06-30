/*eslint quotes: ["error", "single"]*/
/*eslint-env es6*/

const toolbox = '' + 
    '<category name="Data" id="data" colour="#4b4a60" secondaryColour="#454458">' + //custom="VARIABLE">'+
    '<block type="data_row_count">' +
    '</block>' +
    '<block type="data_get">' +
        '<value name="COLUMN">' +
            '<shadow type="data_get_menu"></shadow>' +
        '</value>' +
    '</block>' +
    '<block type="data_select_next"></block>' +
    '<block type="data_filter">'+
        '<value name="COLUMN">' +
            '<shadow type="data_get_menu"></shadow>' +
        '</value>' +
        '<value name="STRING">' +
        '<shadow type="text">' +
            '<field name="TEXT"></field>' +
        '</shadow>' +
        '</value>' +
    '</block>' +
    '</category>';

export default toolbox;