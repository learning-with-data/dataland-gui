/* eslint-disable jest/expect-expect */
import "cypress-file-upload";

describe("The GUI", () => {
  function moveBlockfromToolbox(primitive_name, x, y) {
    cy.get(`[data-id="${primitive_name}"]`)
      .trigger("pointerdown", { button: 0, force: true })
      .trigger("pointermove", { clientX: x, clientY: y, force: true });

    cy.get(".blocklyDragging.blocklySelected").as("newBlockId");

    cy.get("@newBlockId")
      .trigger("pointermove", { clientX: x, clientY: y, force: true })
      .trigger("pointerup", { force: true });
  }

  beforeEach(function () {
    cy.viewport(1920, 1000);
    cy.visit("/example/example.html");
  });

  it("successfully loads", () => {
    cy.get(".gui-container").should("exist");
  });

  it("opens every block category successfully", () => {
    // Control category
    cy.get("#blockly-1").click();
    cy.get("[data-id='control_wait']");

    // Operators category
    cy.get("#blockly-2").click();
    cy.get("[data-id='operator_boolean']");

    // Data category
    cy.get("#blockly-3").click();
    cy.get("[data-id='data_filter']");

    // Visualization category
    cy.get("#blockly-4").click();
    cy.get("[data-id='visualization_clear']");
  });

  it("moves the block to coding areas", function () {
    cy.get("#blockly-1").click();
    cy.get(".blocklySvg .blocklyWorkspace")
      .contains("⯈ on project start")
      .should("not.exist");
    moveBlockfromToolbox("event_onprojectstart", 700, 300);
    cy.get(".blocklySvg .blocklyWorkspace").contains("⯈ on project start");
  });

  it("can create a variable", function () {
    cy.visit("/example/example.html", {
      onBeforeLoad(win) {
        cy.stub(win, "prompt").returns("avariable");
      },
    });
    cy.get("#blockly-5").click();
    cy.get("[data-id='variables_set']").should("not.exist");
    cy.get(".blocklyFlyoutButton").click();

    cy.window().its("prompt").should("be.called");
    cy.get("[data-id='variables_set']");
    cy.get(".blocklyDraggable .blocklyText").contains("avariable");
    cy.get(".blocklyDraggable .blocklyText").contains("to");
  });

  it("can import a CSV file", function () {
    const csvFixturePath = "../fixtures/sample1.csv";

    cy.get("#dataImportLink").attachFile(csvFixturePath);
    cy.get(".table-container").contains("New York City");
  });

  it("shows spinner when importing a large CSV file", function () {
    const csvFixturePath = "../fixtures/chapel-hill-weather-ncei.csv";

    cy.get("#dataImportLink").attachFile(csvFixturePath);
    cy.get("#btn-import-data").contains("Loading");
    cy.get(".table-container").contains("CHAPEL HILL 4.3 WSW, NC US", {
      timeout: 10000,
    });
    cy.get("#btn-import-data").contains("Import data");
  });

  // Commented out till this is resolved: https://github.com/cypress-io/cypress/issues/949
  // eslint-disable-next-line jest/no-commented-out-tests
  // it("enables downloading projects with the correct file name", function() {
  //   var projectTitle = "Test project";
  //   cy.get("#title-input").clear().type(projectTitle).blur();

  //   cy.get("#file-dropdown").click();
  //   cy.get("#download-menuitem").click();
  //   cy.get("a#download-link").should("have.attr", "download", projectTitle + ".dbp");
  // });

  it("can load and run a project file", function () {
    const projectFixturePath = "../fixtures/sample1.dbp";

    cy.visit("/example/example.html", {
      onBeforeLoad: (win) => {
        cy.spy(win.console, "log").as("consoleLog");
      },
    });

    cy.get("#file-dropdown").click();
    cy.get("#loadLink").attachFile({
      filePath: projectFixturePath,
      encoding: "binary",
    });

    cy.get(".data-table").contains("New York City");
    cy.get("[data-id='yN#Fr5u_-RIrzSRT~d-$");
    cy.get("[data-id='yN#Fr5u_-RIrzSRT~d-$").contains("City");

    cy.spy(window.console, "log").as("consoleLog");
    cy.get("#btn-start").click();
    cy.get("#btn-start").contains("Running");
    cy.log("@consoleLog");
    cy.get("@consoleLog").should("be.calledThrice");
    cy.get("@consoleLog").should("be.calledWith", "Los Angeles");
    cy.get("@consoleLog").should("be.calledWith", "New York City");
    cy.get("@consoleLog").should("be.calledWith", "Paris");
  });

  it("shows an error when a non-valid project is loaded", function () {
    const invalidProjectFixturePath = "../fixtures/sample1.csv";
    cy.get("#file-dropdown").click();
    cy.get("#loadLink").attachFile(invalidProjectFixturePath);

    cy.get(".error-notification").contains("Whoops!");
    cy.get(".error-notification").contains("Failed to load project.");

    // Dismiss the error
    cy.get(".error-notification .close").click();
    cy.get(".error-notification").should("not.exist");
  });

  it("shows an error when a non-valid CSV is loaded", function () {
    const invalidCsvFixturePath = "../fixtures/sample1.dbp";
    cy.get("#dataImportLink").attachFile(invalidCsvFixturePath);

    cy.get(".error-notification").contains("Whoops!");
    cy.get(".error-notification").contains("Parse error while importing CSV file.");

    // Dismiss the error
    cy.get(".error-notification .close").click();
    cy.get(".error-notification").should("not.exist");
  });
});
