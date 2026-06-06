import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";
import {
  provideFluentDesignSystem,
  allComponents,
} from "@fluentui/web-components";

// Register Fluent UI Web Components
provideFluentDesignSystem().register(allComponents);

const app = mount(App, {
  target: document.getElementById("app")!,
});

export default app;
