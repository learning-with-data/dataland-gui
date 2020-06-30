/*eslint quotes: ["error", "single"]*/
/*eslint-env es6*/
const toolbox = '' +
    '<category name="Control" id="control" colour="#FFAB19" secondaryColour="#CF8B17">' +
        '<block type="event_onprojectstart" id="event_onprojectstart"></block>' +
        '<block type="control_repeat" id="control_repeat">' +
            '<value name="TIMES">' +
                '<shadow type="math_whole_number">' +
                '<field name="NUM">10</field>' +
                '</shadow>' +
            '</value>' +
        '</block>' +
        '<block type="control_if"></block>' +
        '<block type="control_if_else"></block>' +
        '<block type="control_wait">' +
            '<value name="DURATION">' +
                '<shadow type="math_positive_number">' +
                '<field name="NUM">1</field>' +
                '</shadow>' +
            '</value>' +
        '</block>' +
    '</category>';

export default toolbox;