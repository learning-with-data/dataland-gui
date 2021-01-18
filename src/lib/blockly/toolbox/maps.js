import { BLOCKARG_MAPS_COLOR } from "../constants";

const toolbox = `
    <category name="🗺️ Maps" categorystyle="maps_category" id="maps_category">
        <block type="maps_clear" id="maps_clear"/>
        <sep gap="32"></sep>
        <block type="maps_set_latitude" id="maps_set_latitude"/>
        <block type="maps_set_longitude" id="maps_set_longitude"/>
        <sep gap="32"></sep>
        <block type="maps_set_size" id="maps_set_size"/>
        <sep gap="32"></sep>
        <block type="maps_set_color_as_static" id="maps_set_color_as_static">
            <value name="${BLOCKARG_MAPS_COLOR}">
                <shadow type="colour_picker"></shadow>
            </value>
        </block>
    </category>
`;

export default toolbox;
