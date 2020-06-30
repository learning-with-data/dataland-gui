import { shallow } from "enzyme";

// Temporary workaround for https://github.com/enzymejs/enzyme/issues/2202
// Ideally WrappingComponent (see WrappingComponent.js) should be used

function shallowWrapper(Component) {
  return shallow(Component)
    .dive() // Gets the component
    .dive(); // Gets the child of the component
}

export default shallowWrapper;
