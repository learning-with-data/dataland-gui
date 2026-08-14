import React from "react";
import ReactDOM from "react-dom/client";

import {Gui, initBlockly} from "../src/index.jsx";

import "bootstrap/dist/css/bootstrap.min.css";

let params = new URL(document.location).searchParams;
let microworld = params.get("microworld") ?? "plots";

initBlockly();
const root = ReactDOM.createRoot(document.getElementById("dataland-gui-example-root"));
root.render(
  <Gui
    initialProjectTitle="Untitled Project"
    backend={false}
    microworld={microworld}
  />
);
