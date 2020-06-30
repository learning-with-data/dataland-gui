/*eslint quotes: ["error", "single"]*/
/*eslint-env es6*/

const toolbox = '' +
    '<category name="DEBUG" id="debug" colour="#aeaca9" secondaryColour="#737270">' +
        '<block type="debug_log">' +
            '<value name="STRING">' +
                '<shadow type="text">' +
                '<field name="TEXT">Hello DataLand!</field>' +
                '</shadow>' +
            '</value>' +
        '</block>' +
    '</category>';

export default toolbox;