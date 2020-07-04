/*eslint quotes: ["error", "single"]*/
/*eslint-env es6*/

const toolbox = '' + 
    '<category name="Visualization" id="data" colour="#0e6655" secondaryColour="#196f3d">' +
    '<block type="visualization_set_color">' +
        '<value name="COLOR">' +
            '<shadow type="colour_picker"></shadow>' +
        '</value>' +
    '</block>' +
    '<block type="visualization_set_title">' +
    '<value name="STRING">' +
            '<shadow type="text">' +
            '<field name="TEXT">My awesome visualization</field>' +
            '</shadow>' +
        '</value>' +
    '</block>' +
    '<block type="visualization_scatterplot">' +
        '<value name="COLUMN1">' +
            '<shadow type="visualization_get_menu"></shadow>' +
        '</value>' +
        '<value name="COLUMN2">' +
            '<shadow type="visualization_get_menu"></shadow>' +
        '</value>' +
    '</block>' +
    '<block type="visualization_clear">' +
    '</block>' +
    '</category>';

export default toolbox;