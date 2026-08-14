import "cypress-file-upload";

const path = require("path");

describe("The GUI", () => {
  function moveBlockfromToolbox(primitive_name, x, y, parent_selector = "") {
    const selector = parent_selector
      ? `${parent_selector} [data-id="${primitive_name}"]`
      : `[data-id="${primitive_name}"]`;

    cy.get(selector)
      .should("be.visible")
      .realMouseDown({ position: "center" });

    cy.get("body").realMouseMove(x, y);

    // Give Blockly a moment to register the drag before releasing
    cy.wait(100); // eslint-disable-line cypress/no-unnecessary-waiting

    cy.get("body").realMouseUp();
  }

  // Newer Blockly versions no longer use window.prompt() to ask for a
  // variable name; they open a modal <dialog class="blocklyDialog"> with a
  // text input and OK/Cancel buttons. Type the name and click OK to
  // answer. The OK button must be clicked (not Enter): an implicit form
  // submission closes the dialog with an empty return value, which
  // Blockly treats as a cancel.
  function respondToBlocklyPrompt(name) {
    cy.get("dialog.blocklyDialog .blocklyDialogInput", { timeout: 5000 }).clear();
    cy.get("dialog.blocklyDialog .blocklyDialogInput").type(name);
    cy.get("dialog.blocklyDialog .blocklyDialogConfirmButton").realClick();
    cy.get("dialog.blocklyDialog").should("not.exist");
  }

  beforeEach(function () {
    cy.viewport(1920, 1000);
    cy.visitApp();
  });

  it("successfully loads", () => {
    cy.get(".gui-container").should("exist");
  });

  it("opens every block category successfully", () => {
    // Control category
    cy.get(".blocklyToolboxCategory#control_category").realClick();
    cy.get("[data-id='control_wait']");

    // Operators category
    cy.get(".blocklyToolboxCategory#operator_category").realClick();
    cy.get("[data-id='operator_boolean']");

    // Data category
    cy.get(".blocklyToolboxCategory#data_category").realClick();
    cy.get("[data-id='data_filter']");

    // Visualization category
    cy.get(".blocklyToolboxCategory#visualization_category").realClick();
    cy.get("[data-id='visualization_clear']");
  });

  it("moves the block to coding areas", function () {
    cy.get(".blocklyToolboxCategory#control_category").realClick();
    cy.get(".blocklySvg .blocklyWorkspace")
      .contains("wait")
      .should("not.exist");
    moveBlockfromToolbox("control_wait", 700, 300);
    cy.get(".blocklySvg .blocklyWorkspace").contains("wait");
  });

  it("can create a variable", function () {
    cy.get(".blocklyToolboxCategory#variable_category").realClick();
    cy.get(".blocklyFlyout .variables_set").should("not.exist");
    //FIXME: force: true should not be needed below
    cy.get(".blocklyFlyoutButton").realClick();

    // The variable name is asked for in a modal dialog
    respondToBlocklyPrompt("avariable");

    // The variable block should show up
    cy.get(".blocklyFlyout .variables_set");
    cy.get(".blocklyDraggable .blocklyText").contains("avariable");
    cy.get(".blocklyDraggable .blocklyText").contains("to");

    // The variable monitor should show the variable
    cy.get(".viz-var-container ul").contains("Variables").realClick();
    cy.get(".viz-var-container .card-body").contains("avariable");
  });

  it("can delete a variable", function () {
    cy.get(".blocklyToolboxCategory#variable_category").realClick();

    // Create a variable
    //FIXME: force: true should not be needed below
    cy.get(".blocklyFlyoutButton").realClick();
    respondToBlocklyPrompt("avariable");

    // Open variables monitor
    cy.get(".viz-var-container ul").contains("Variables").realClick();
    // Variables monitor should show "avariable"
    cy.get(".viz-var-container .card-body").contains("avariable");

    // Start with clicking on the toolbar
    cy.get(".blocklyToolboxCategory#variable_category").realClick();
    // First click puts the block in the workspace; second click shows the menu
    cy.get(".blocklyFlyout .variables_set").realClick();
    cy.get(".blocklyTrash + .blocklyBlockCanvas .variables_set").contains("avariable").realClick();

    // Click the delete menu item
    cy.contains(
      ".blocklyMenuItemContent",
      "Delete the 'avariable' variable"
    ).realClick();

    // The variables block should not exist (this was the only variable)
    cy.get(".blocklyToolboxCategory#variable_category").realClick();
    cy.get(".blocklyFlyout .variables_set").should("not.exist");

    // The variable monitor should be empty
    cy.get(".viz-var-container .card-body")
      .contains("avariable")
      .should("not.exist");
  });

  it("can rename a variable", function () {
    cy.get(".blocklyToolboxCategory#variable_category").realClick();

    // Create a variable
    //FIXME: force: true should not be needed below
    cy.get(".blocklyFlyoutButton").realClick();
    respondToBlocklyPrompt("var1");

    // Open variables monitor
    cy.get(".viz-var-container ul").contains("Variables").realClick();
    // Variables monitor should show "var1"
    cy.get(".viz-var-container .card-body").contains("var1");

    // First click puts the block in the workspace; second click shows the menu
    // Start with clicking on the toolbar
    cy.get(".blocklyToolboxCategory#variable_category").realClick();
    cy.get(".blocklyFlyout .variables_set").realClick();

    cy.get(".blocklyTrash + .blocklyBlockCanvas .variables_set").contains("var1").realClick();

    // Click the rename menu item
    cy.contains(
      ".blocklyMenuItemContent",
      "Rename the 'var1' variable"
    ).realClick();
    respondToBlocklyPrompt("var2");

    // Variables monitor should show "var2"
    cy.get(".viz-var-container .card-body").contains("var2");
  });

  it("can import a CSV file", function () {
    const csvFixturePath = "../fixtures/sample1.csv";

    cy.get(".tableviewer-header .data-import-link").attachFile(csvFixturePath);
    cy.get(".table-container").contains("New York City");
  });

  it("shows spinner when importing a large CSV file", function () {
    const csvFixturePath = "../fixtures/chapel-hill-weather-ncei.csv";

    cy.get(".tableviewer-header .data-import-link").attachFile(csvFixturePath);
    cy.get(".tableviewer-header .data-import-button").contains("Loading");
    cy.get(".table-container").contains("CHAPEL HILL 4.3 WSW, NC US", {
      timeout: 10000,
    });
    cy.get(".tableviewer-header .data-import-button").contains("Import data");
  });

  it("shows correct dropdown menus in blocks after importing CSV file", function () {
    const csvFixturePath = "../fixtures/sample1.csv";

    cy.get(".tableviewer-header .data-import-link").attachFile(csvFixturePath);
    cy.get(".blocklyToolboxCategory#data_category").realClick();

    moveBlockfromToolbox("data_get", 700, 300);
    cy.get(
      ".blocklySvg .blocklyWorkspace .blocklyDraggable text.blocklyDropdownText"
    ).realClick();

    cy.get(".blocklyDropDownContent").contains("Row #");
    cy.get(".blocklyDropDownContent").contains("City");
    cy.get(".blocklyDropDownContent").contains("Latitude");
    cy.get(".blocklyDropDownContent").contains("Longitude");
  });

  it("enables downloading projects with the correct file name", function () {
    const projectTitle = "Test project";

    const downloadsFolder = Cypress.config("downloadsFolder");
    const filename = path.join(downloadsFolder, projectTitle + ".dbp");

    cy.get(".project-title-input").clear();
    cy.get(".project-title-input").type(projectTitle);
    cy.get(".project-title-input").blur();

    cy.get(".file-dropdown").realClick();
    cy.get(".download-menuitem").realClick();
    cy.readFile(filename, { timeout: 1500 }).should("have.length.gt", 20);
  });

  it("can load and run a project file", function () {
    const projectFixturePath = "../fixtures/sample1.dbp";

    cy.visitApp("/example/example.html", {
      onBeforeLoad: (win) => {
        cy.spy(win.console, "log").as("consoleLog");
      },
    });

    cy.get(".file-dropdown").realClick();
    cy.get(".upload-link").attachFile({
      filePath: projectFixturePath,
      encoding: "binary",
    });

    cy.get(".data-table").contains("New York City");
    cy.get("[data-id='yN#Fr5u_-RIrzSRT~d-$");
    cy.get("[data-id='yN#Fr5u_-RIrzSRT~d-$").contains("City");

    cy.spy(window.console, "log").as("consoleLog");
    cy.get(".start-button").realClick();
    cy.get(".start-button").contains("Running");
    cy.log("@consoleLog");
    cy.get("@consoleLog").should("be.calledThrice");
    cy.get("@consoleLog").should("be.calledWith", "Los Angeles");
    cy.get("@consoleLog").should("be.calledWith", "New York City");
    cy.get("@consoleLog").should("be.calledWith", "Paris");
  });

  it("shows an error when a non-valid project is loaded", function () {
    const invalidProjectFixturePath = "../fixtures/sample1.csv";
    cy.get(".file-dropdown").realClick();
    cy.get(".upload-link").attachFile(invalidProjectFixturePath);

    cy.get(".error-notification").contains("Whoops!");
    cy.get(".error-notification").contains("Failed to load project.");

    // Dismiss the error
    cy.get(".error-notification .btn-close").realClick();
    cy.get(".error-notification").should("not.exist");
  });

  it("shows an error when a non-valid CSV is loaded", function () {
    const invalidCsvFixturePath = "../fixtures/sample1.dbp";
    cy.get(".tableviewer-header .data-import-link").attachFile(
      invalidCsvFixturePath
    );

    cy.get(".error-notification").contains("Whoops!");
    cy.get(".error-notification").contains(
      "Parse error while importing CSV file."
    );

    // Dismiss the error
    cy.get(".error-notification .btn-close").realClick();
    cy.get(".error-notification").should("not.exist");
  });

  it("loads microworlds correctly", function () {
    cy.visitApp("/example/example.html?microworld=maps");
    cy.get(".blocklyToolboxCategory#maps_category").realClick();
    cy.get("[data-id='maps_clear']");

    cy.visitApp("/example/example.html?microworld=plots");
    cy.get(".blocklyToolboxCategory#visualization_category").click({ force: true });
    cy.get("[data-id='visualization_clear']");
  });

  it("loads multiple instances in the same page correctly", function () {
    cy.visitApp("/example/multi-example.html");
    cy.get("div#editor-1 div.gui-container").should("exist");
    cy.get("div#editor-2 div.gui-container").should("exist");
    cy.get("div#editor-3 div.gui-container").should("exist");
  });

  it("loads data in multiple instances correctly", function () {
    cy.visitApp("/example/multi-example.html");

    const csvFixturePath = "../fixtures/sample1.csv";

    // Right table should update
    cy.get("div#editor-2 .tableviewer-header .data-import-link").attachFile(
      csvFixturePath
    );
    cy.get("div#editor-2 .table-container").contains("New York City");
    cy.get("div#editor-1 .table-container").contains("No data loaded");
    cy.get("div#editor-3 .table-container").contains("No data loaded");

    // Block menus should show up in the right places
    cy.get("div#editor-2 .blocklyToolboxCategory#data_category").realClick();
    moveBlockfromToolbox("data_get", 900, 600, "div#editor-2");
    // Wait for the block to show up - for some reason, there seems to be a delay
    cy.wait(30); // eslint-disable-line cypress/no-unnecessary-waiting
    cy.get(
      "div#editor-2 .blocklySvg .blocklyWorkspace .blocklyDraggable text.blocklyDropdownText"
    ).realClick();

    cy.get(".blocklyDropDownContent").contains("Row #");
    cy.get(".blocklyDropDownContent").contains("City");
    cy.get(".blocklyDropDownContent").contains("Latitude");
    cy.get(".blocklyDropDownContent").contains("Longitude");

    // Other workspaces should not show those menus
    cy.get(
      "div#editor-2 .blocklySvg .blocklyWorkspace .blocklyDraggable text.blocklyDropdownText"
    ).type("{del}"); // This deletes the block in workspace 2, but is not strictly needed
    cy.get("div#editor-3 .blocklyToolboxCategory#data_category").realClick();
    moveBlockfromToolbox("data_get", 900, 900, "div#editor-3");
    // Wait for the block to show up - for some reason, there seems to be a delay
    cy.wait(30); // eslint-disable-line cypress/no-unnecessary-waiting
    cy.get(
      "div#editor-3 .blocklySvg .blocklyWorkspace .blocklyDraggable text.blocklyDropdownText"
    ).realClick();
    cy.get(".blocklyDropDownContent").contains("Row #");
    cy.get(".blocklyDropDownContent").contains("City").should("not.exist");
    cy.get(".blocklyDropDownContent").contains("Latitude").should("not.exist");
    cy.get(".blocklyDropDownContent").contains("Longitude").should("not.exist");
  });
});
