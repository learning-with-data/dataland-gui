/* eslint-disable jest/expect-expect */

describe("The GUI", () => {
  function moveBlockfromToolbox(primitive_name, x, y) {
    cy.get(`[data-id="${primitive_name}"]`)
      .trigger("mousedown", { button: 0, force: true })
      .trigger("mousemove", { clientX: x, clientY: y, force: true });

    cy.get(".blocklyDragging.blocklySelected").as("newBlockId");

    cy.get("@newBlockId")
      .trigger("mousemove", { clientX: x, clientY: y, force: true })
      .trigger("mouseup", { force: true });
  }

  beforeEach(function () {
    cy.viewport(1920, 1000);
    cy.visit("/example/example.html");
  });

  it("successfully loads", () => {
    cy.get(".gui-container").should("exist");
  });

  it("moves the block to coding areas", function () {
    cy.get(".blocklySvg .blocklyWorkspace")
      .contains("⯈ on project start")
      .should("not.exist");
    moveBlockfromToolbox("event_onprojectstart", 700, 300);
    cy.get(".blocklySvg .blocklyWorkspace").contains("⯈ on project start");
  });
});
