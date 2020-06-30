/*eslint quotes: ["error", "single"]*/
/*eslint-env es6*/
const toolbox = '' +
    '<category name="Operators" id="operators" colour="#40BF4A" secondaryColour="#389438">'+
    '<block type="operator_add">' +
        '<value name="NUM1">' +
            '<shadow type="math_number">' +
                '<field name="NUM"></field>' +
            '</shadow>' +
        '</value>' +
        '<value name="NUM2">' +
            '<shadow type="math_number">' +
                '<field name="NUM"></field>' +
            '</shadow>' +
        '</value>' +
    '</block>' +
    '<block type="operator_subtract">' +
        '<value name="NUM1">' +
            '<shadow type="math_number">' +
                '<field name="NUM"></field>' +
            '</shadow>' +
        '</value>' +
        '<value name="NUM2">' +
            '<shadow type="math_number">' +
                '<field name="NUM"></field>' +
            '</shadow>' +
        '</value>' +
    '</block>' +
    '<block type="operator_multiply">' +
        '<value name="NUM1">' +
            '<shadow type="math_number">' +
                '<field name="NUM"></field>' +
            '</shadow>' +
        '</value>' +
        '<value name="NUM2">' +
            '<shadow type="math_number">' +
                '<field name="NUM"></field>' +
            '</shadow>' +
        '</value>' +
    '</block>' +
    '<block type="operator_divide">' +
        '<value name="NUM1">' +
            '<shadow type="math_number">' +
                '<field name="NUM"></field>' +
            '</shadow>' +
        '</value>' +
        '<value name="NUM2">' +
            '<shadow type="math_number">' +
                '<field name="NUM"></field>' +
            '</shadow>' +
        '</value>' +
    '</block>' +
    '<block type="operator_random">' +
        '<value name="FROM">' +
            '<shadow type="math_number">' +
                '<field name="NUM">1</field>' +
            '</shadow>' +
        '</value>' +
        '<value name="TO">' +
            '<shadow type="math_number">' +
                '<field name="NUM">10</field>' +
            '</shadow>' +
        '</value>' +
    '</block>' +
    '<block type="operator_lt">' +
        '<value name="OPERAND1">' +
            '<shadow type="text">' +
                '<field name="TEXT"></field>' +
            '</shadow>' +
        '</value>' +
        '<value name="OPERAND2">' +
            '<shadow type="text">' +
                '<field name="TEXT"></field>' +
            '</shadow>' +
        '</value>' +
    '</block>' +
    '<block type="operator_equals">' +
        '<value name="OPERAND1">' +
            '<shadow type="text">' +
                '<field name="TEXT"></field>' +
            '</shadow>' +
        '</value>' +
        '<value name="OPERAND2">' +
            '<shadow type="text">' +
                '<field name="TEXT"></field>' +
            '</shadow>' +
        '</value>' +
    '</block>' +
    '<block type="operator_gt">' +
        '<value name="OPERAND1">' +
            '<shadow type="text">' +
                '<field name="TEXT"></field>' +
            '</shadow>' +
        '</value>' +
        '<value name="OPERAND2">' +
            '<shadow type="text">' +
                '<field name="TEXT"></field>' +
            '</shadow>' +
        '</value>' +
    '</block>' +
    '<block type="operator_and"></block>' +
    '<block type="operator_or"></block>' +
    '<block type="operator_not"></block>' +
    '<block type="operator_join">' +
        '<value name="STRING1">' +
            '<shadow type="text">' +
                '<field name="TEXT">hello</field>' +
            '</shadow>' +
        '</value>' +
        '<value name="STRING2">' +
            '<shadow type="text">' +
                '<field name="TEXT">world</field>' +
            '</shadow>' +
        '</value>' +
    '</block>' +
    '<block type="operator_letter_of">' +
        '<value name="LETTER">' +
            '<shadow type="math_whole_number">' +
                '<field name="NUM">1</field>' +
            '</shadow>' +
        '</value>' +
        '<value name="STRING">' +
            '<shadow type="text">' +
                '<field name="TEXT">world</field>' +
            '</shadow>' +
        '</value>' +
    '</block>' +
    '<block type="operator_length">' +
        '<value name="STRING">' +
            '<shadow type="text">' +
                '<field name="TEXT">world</field>' +
            '</shadow>' +
        '</value>' +
    '</block>' +
    '<block type="operator_mod">' +
        '<value name="NUM1">' +
            '<shadow type="math_number">' +
                '<field name="NUM"></field>' +
            '</shadow>' +
        '</value>' +
        '<value name="NUM2">' +
            '<shadow type="math_number">' +
                '<field name="NUM"></field>' +
            '</shadow>' +
        '</value>' +
    '</block>' +
    '<block type="operator_mathop">' +
        '<value name="OPERATOR">' +
            '<shadow type="operator_mathop_menu"></shadow>' +
        '</value>' +
        '<value name="NUM">' +
            '<shadow type="math_number">' +
                '<field name="NUM"></field>' +
            '</shadow>' +
        '</value>' +
    '</block>' +
    '</category>';

export default toolbox;
