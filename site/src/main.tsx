/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App";
import { ColorModeProvider } from "./color-mode";
import "./index.css";

render(
  () => (
    <ColorModeProvider>
      <App />
    </ColorModeProvider>
  ),
  document.getElementById("root")!,
);
