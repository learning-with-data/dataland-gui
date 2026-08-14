// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

Cypress.Commands.add("visitApp", (url = "/example/example.html", options = {}) => {
  const originalOnBeforeLoad = options.onBeforeLoad;

  cy.visit(url, {
    ...options,
    onBeforeLoad(win) {
      // Block beforeunload listeners to prevent "Leave site?" prompts
      const originalAddEventListener = win.addEventListener;
      win.addEventListener = function (event, listener, options) {
        if (event === "beforeunload") {
          return;
        }
        return originalAddEventListener.call(this, event, listener, options);
      };

      // Call the original onBeforeLoad if provided (e.g., for console spying)
      if (originalOnBeforeLoad) {
        originalOnBeforeLoad(win);
      }
    },
  });
});
