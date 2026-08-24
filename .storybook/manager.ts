import { addons } from "storybook/manager-api";
import { create } from "storybook/theming/create";

// Brand the catalogue itself, so the two consumer teams can tell at a glance
// which library they are looking at.
addons.setConfig({
  theme: create({
    base: "light",
    brandTitle: "Open Elements UI",
    brandUrl: "https://github.com/OpenElementsLabs/open-elements-ui",
    colorPrimary: "#5cba9e",
    colorSecondary: "#020144",
  }),
});
