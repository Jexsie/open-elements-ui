import type { Preview } from "@storybook/react-vite";
import type { ReactNode } from "react";
import "./preview.css";

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    layout: "padded",
  },
  decorators: [
    // Stand in for the consuming app's root element, which is where the brand
    // body font and base colours are applied.
    (Story: () => ReactNode) => (
      <div className="font-body text-foreground bg-background">
        <Story />
      </div>
    ),
  ],
};

export default preview;
