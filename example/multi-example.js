import React from "react";
import ReactDOM from "react-dom";

import { Gui, initBlockly } from "../src/index.js";

import "bootstrap/dist/css/bootstrap.min.css";

let params = new URL(document.location).searchParams;
let microworld = params.get("microworld") ?? "plots";
let blocklyInjectionOptions = {
  zoom: {
    controls: true,
    wheel: false,
    startScale: 0.85,
    maxScale: 4,
    minScale: 0.25,
    scaleSpeed: 1.1,
  },
};

initBlockly();
ReactDOM.render(
  <>
    <div
      style={{ height: "400px", width: "90vw", margin: "0 auto" }}
      id="editor-1"
    >
      <Gui
        initialProjectTitle="Untitled Project 1"
        backend={false}
        microworld={microworld}
        blocklyInjectionOptions={blocklyInjectionOptions}
      />
    </div>

    <div
      style={{
        height: "50px",
        width: "90vw",
        border: "1px solid black",
        margin: "0 auto",
      }}
    ></div>

    <div
      style={{ height: "400px", width: "90vw", margin: "0 auto" }}
      id="editor-2"
    >
      <Gui
        initialProjectTitle="Untitled Project 2"
        backend={false}
        microworld={microworld}
        blocklyInjectionOptions={blocklyInjectionOptions}
      />
    </div>

    <div
      style={{
        height: "50px",
        width: "90vw",
        border: "1px solid black",
        margin: "0 auto",
      }}
    ></div>

    <div
      style={{ height: "400px", width: "90vw", margin: "0 auto" }}
      id="editor-3"
    >
      <Gui
        initialProjectTitle="Untitled Project 3"
        backend={false}
        microworld={microworld}
        blocklyInjectionOptions={blocklyInjectionOptions}
      />
    </div>
  </>,
  document.getElementById("dataland-gui-example-root")
);
