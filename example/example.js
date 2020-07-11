import React from "react";
import ReactDOM from "react-dom";

import Gui from "../src/index.js";

ReactDOM.render(
  <Gui initialProjectTitle="Untitled Project" backend={false} />,
  document.getElementById("dataland-gui-example-root")
);
