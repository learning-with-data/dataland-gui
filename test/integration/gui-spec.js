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
    cy.get(".blocklyDraggable .blocklyText").contains("set");
    cy.get(".blocklyDraggable .blocklyText").contains("avariable");
    cy.get(".blocklyDraggable .blocklyText").contains("to");
  });

  it("can import a CSV file", function () {
    const csvFixturePath = "../fixtures/sample1.csv";

    cy.get("#dataImportLink").attachFile(csvFixturePath);
    cy.get(".table-container").contains("New York City");

  });
});
