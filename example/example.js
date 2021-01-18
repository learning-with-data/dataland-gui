import React from "react";
import ReactDOM from "react-dom";

import Gui from "../src/index.js";

import "bootstrap/dist/css/bootstrap.min.css";

let params = new URL(document.location).searchParams;
let microworld = params.get("microworld") ?? "plots";

ReactDOM.render(
  <Gui
    initialProjectTitle="Untitled Project"
    backend={false}
    microworld={microworld}
  />,
  document.getElementById("dataland-gui-example-root")
);
